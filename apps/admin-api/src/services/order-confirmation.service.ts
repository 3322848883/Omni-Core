import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * 订单确认服务
 * 处理个人收款码支付的订单确认和拒绝逻辑
 */

export interface PendingOrder {
  id: number;
  orderNo: string;
  userId: string;
  orderType: string;
  status: string;
  amount: number;
  trafficLimit: number | null;
  durationDays: number | null;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    username: string;
    email: string;
  };
  paymentProof?: {
    id: number;
    imageUrl: string;
    remark: string | null;
    status: string;
    createdAt: Date;
  };
}

export interface ConfirmOrderResult {
  success: boolean;
  orderId: number;
  orderNo: string;
  newStatus: string;
  userUpdated: boolean;
  subscriptionUpdated: boolean;
}

export interface RejectOrderResult {
  success: boolean;
  orderId: number;
  orderNo: string;
  newStatus: string;
  reason: string;
}

/**
 * 获取待确认订单列表
 * 条件：payment_method 为 wechat_personal 或 alipay_personal 且状态为 pending
 */
export async function getPendingConfirmationOrders(
  page: number = 1,
  limit: number = 20
): Promise<{ items: PendingOrder[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;

  // 构建查询：获取使用个人收款码且状态为 pending 的订单
  const query = db('orders')
    .where('status', 'pending')
    .whereIn('payment_method', ['wechat_personal', 'alipay_personal']);

  // 获取总数
  const [countResult] = await query.clone().count('* as count');
  const total = parseInt(countResult.count as string, 10);

  // 获取订单列表
  const orders = await query
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // 获取关联的用户信息和付款凭证
  const orderIds = orders.map(o => o.id);
  const userIds = orders.map(o => o.user_id);

  // 批量获取用户信息
  const users = await db('users')
    .whereIn('user_id', userIds)
    .select('user_id', 'username', 'email');

  const userMap = new Map(users.map(u => [u.user_id, u]));

  // 批量获取付款凭证
  const paymentProofs = orderIds.length > 0
    ? await db('order_payment_proofs')
        .whereIn('order_id', orderIds)
        .where('status', 'pending')
        .select('*')
    : [];

  const proofMap = new Map(paymentProofs.map(p => [p.order_id, p]));

  // 组装结果
  const items: PendingOrder[] = orders.map(order => {
    const user = userMap.get(order.user_id);
    const proof = proofMap.get(order.id);

    return {
      id: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      orderType: order.order_type,
      status: order.status,
      amount: parseFloat(order.amount),
      trafficLimit: order.traffic_limit,
      durationDays: order.duration_days,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      user: user ? {
        username: user.username,
        email: user.email,
      } : undefined,
      paymentProof: proof ? {
        id: proof.id,
        imageUrl: proof.image_url,
        remark: proof.remark,
        status: proof.status,
        createdAt: proof.created_at,
      } : undefined,
    };
  });

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 确认订单收款
 * @param orderId 订单ID
 * @param adminId 管理员ID
 * @param adminUsername 管理员用户名
 * @param remark 审核备注（可选）
 */
export async function confirmOrderPayment(
  orderId: string | number,
  adminId: number,
  adminUsername: string,
  remark?: string
): Promise<ConfirmOrderResult> {
  const id = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

  if (isNaN(id)) {
    throw new ValidationError([{ field: 'orderId', message: '无效的订单ID' }]);
  }

  // 使用事务确保数据一致性
  return await db.transaction(async (trx) => {
    // 1. 获取订单信息并锁定
    const order = await trx('orders')
      .where('id', id)
      .forUpdate()
      .first();

    if (!order) {
      throw new NotFoundError('Order', orderId.toString());
    }

    // 验证订单状态
    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: `订单状态为 ${order.status}，无法确认收款` },
      ]);
    }

    // 验证支付方式
    if (!['wechat_personal', 'alipay_personal'].includes(order.payment_method)) {
      throw new ValidationError([
        { field: 'paymentMethod', message: '该订单不是个人收款码支付订单' },
      ]);
    }

    const now = new Date();
    const startDate = now;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (order.duration_days || 30));

    // 2. 更新订单状态为 paid
    await trx('orders')
      .where('id', id)
      .update({
        status: 'paid',
        payment_time: now,
        start_date: startDate,
        end_date: endDate,
        updated_at: now,
      });

    // 3. 记录订单状态变更日志
    await trx('order_status_logs').insert({
      order_id: id,
      from_status: order.status,
      to_status: 'paid',
      changed_by: adminUsername,
      reason: remark || '管理员确认收款',
      created_at: now,
    });

    // 4. 更新付款凭证状态为 approved
    const paymentProof = await trx('order_payment_proofs')
      .where('order_id', id)
      .where('status', 'pending')
      .first();

    if (paymentProof) {
      await trx('order_payment_proofs')
        .where('id', paymentProof.id)
        .update({
          status: 'approved',
          reviewed_by: adminId,
          review_remark: remark || '审核通过',
          reviewed_at: now,
        });
    }

    // 5. 增加收款码使用次数
    await trx('payment_qrcodes')
      .where('type', order.payment_method)
      .where('is_active', true)
      .increment('usage_count', 1);

    // 6. 给用户添加套餐/流量
    let userUpdated = false;
    let subscriptionUpdated = false;

    if (order.traffic_limit) {
      // 获取用户当前信息
      const user = await trx('users')
        .where('user_id', order.user_id)
        .first();

      if (user) {
        // 更新用户流量和过期时间
        const currentExpireDate = user.expire_date ? new Date(user.expire_date) : null;
        const newExpireDate =
          currentExpireDate && currentExpireDate > now
            ? new Date(currentExpireDate.getTime() + (order.duration_days || 30) * 24 * 60 * 60 * 1000)
            : endDate;

        await trx('users')
          .where('user_id', order.user_id)
          .update({
            traffic_limit: trx.raw('COALESCE(traffic_limit, 0) + ?', [order.traffic_limit]),
            expire_date: newExpireDate,
            updated_at: now,
          });

        userUpdated = true;

        // 更新或创建用户订阅
        const existingSubscription = await trx('user_subscriptions')
          .where('user_id', order.user_id)
          .where('status', 'active')
          .first();

        if (existingSubscription) {
          // 延长现有订阅
          const currentSubEndDate = new Date(existingSubscription.end_date);
          const newSubEndDate = currentSubEndDate > now
            ? new Date(currentSubEndDate.getTime() + (order.duration_days || 30) * 24 * 60 * 60 * 1000)
            : endDate;

          await trx('user_subscriptions')
            .where('id', existingSubscription.id)
            .update({
              end_date: newSubEndDate,
              traffic_limit: trx.raw('COALESCE(traffic_limit, 0) + ?', [order.traffic_limit]),
              updated_at: now,
            });
        } else {
          // 创建新订阅
          await trx('user_subscriptions').insert({
            user_id: order.user_id,
            plan_id: order.plan_id || null,
            status: 'active',
            traffic_limit: order.traffic_limit,
            traffic_used: 0,
            start_date: now,
            end_date: endDate,
            created_at: now,
            updated_at: now,
          });
        }

        subscriptionUpdated = true;
      }
    }

    logger.info(`订单确认收款成功: ${order.order_no}, 管理员: ${adminUsername}`);

    return {
      success: true,
      orderId: id,
      orderNo: order.order_no,
      newStatus: 'paid',
      userUpdated,
      subscriptionUpdated,
    };
  });
}

/**
 * 拒绝订单收款
 * @param orderId 订单ID
 * @param adminId 管理员ID
 * @param adminUsername 管理员用户名
 * @param reason 拒绝原因
 */
export async function rejectOrderPayment(
  orderId: string | number,
  adminId: number,
  adminUsername: string,
  reason: string
): Promise<RejectOrderResult> {
  const id = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

  if (isNaN(id)) {
    throw new ValidationError([{ field: 'orderId', message: '无效的订单ID' }]);
  }

  if (!reason || reason.trim().length === 0) {
    throw new ValidationError([{ field: 'reason', message: '拒绝原因不能为空' }]);
  }

  if (reason.length > 500) {
    throw new ValidationError([{ field: 'reason', message: '拒绝原因不能超过500个字符' }]);
  }

  // 使用事务确保数据一致性
  return await db.transaction(async (trx) => {
    // 1. 获取订单信息并锁定
    const order = await trx('orders')
      .where('id', id)
      .forUpdate()
      .first();

    if (!order) {
      throw new NotFoundError('Order', orderId.toString());
    }

    // 验证订单状态
    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: `订单状态为 ${order.status}，无法拒绝收款` },
      ]);
    }

    // 验证支付方式
    if (!['wechat_personal', 'alipay_personal'].includes(order.payment_method)) {
      throw new ValidationError([
        { field: 'paymentMethod', message: '该订单不是个人收款码支付订单' },
      ]);
    }

    const now = new Date();

    // 2. 更新订单状态为 cancelled
    await trx('orders')
      .where('id', id)
      .update({
        status: 'cancelled',
        updated_at: now,
      });

    // 3. 记录订单状态变更日志
    await trx('order_status_logs').insert({
      order_id: id,
      from_status: order.status,
      to_status: 'cancelled',
      changed_by: adminUsername,
      reason: `拒绝收款: ${reason}`,
      created_at: now,
    });

    // 4. 更新付款凭证状态为 rejected
    const paymentProof = await trx('order_payment_proofs')
      .where('order_id', id)
      .where('status', 'pending')
      .first();

    if (paymentProof) {
      await trx('order_payment_proofs')
        .where('id', paymentProof.id)
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          review_remark: reason,
          reviewed_at: now,
        });
    }

    logger.info(`订单拒绝收款: ${order.order_no}, 原因: ${reason}, 管理员: ${adminUsername}`);

    return {
      success: true,
      orderId: id,
      orderNo: order.order_no,
      newStatus: 'cancelled',
      reason,
    };
  });
}

/**
 * 获取待确认订单数量
 */
export async function getPendingConfirmationCount(): Promise<number> {
  const result = await db('orders')
    .where('status', 'pending')
    .whereIn('payment_method', ['wechat_personal', 'alipay_personal'])
    .count('* as count')
    .first();

  return parseInt(result?.count as string, 10) || 0;
}
