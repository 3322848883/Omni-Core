import db from '@/config/database';
import { generateOrderId, generateOrderNo } from '@/utils/crypto';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '@/errors/AppError';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/constants';
import { Order, CreateOrderData, PaymentInfo } from '@/types/user';
import { ServiceType } from '@/constants/service-type';

/**
 * 验证分页参数
 * @param page - 页码
 * @param limit - 每页数量
 */
const validatePaginationParams = (page: number, limit: number): void => {
  if (page < 1) {
    throw new ValidationError([{ field: 'page', message: 'Page must be greater than or equal to 1' }]);
  }
  if (limit < 1 || limit > 100) {
    throw new ValidationError([{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
  }
};

/**
 * Format database order to Order type
 */
const formatOrder = (order: Record<string, unknown>): Order => {
  return {
    id: order.order_id as string,
    orderNo: order.order_no as string,
    userId: order.user_id as string,
    planId: order.plan_id as string | null,
    orderType: order.order_type as string,
    status: order.status as string,
    amount: parseFloat(order.amount as string),
    trafficLimit: order.traffic_limit as number | null,
    durationDays: order.duration_days as number | null,
    startDate: order.start_date ? new Date(order.start_date as string) : null,
    endDate: order.end_date ? new Date(order.end_date as string) : null,
    paymentMethod: order.payment_method as string | null,
    paymentTime: order.payment_time ? new Date(order.payment_time as string) : null,
    createdAt: new Date(order.created_at as string),
    updatedAt: new Date(order.updated_at as string),
  };
};

/**
 * Get orders list for user with pagination and optional status filter
 */
export const getOrders = async (
  userId: string,
  page: number,
  limit: number,
  status?: string
): Promise<{ orders: Order[]; total: number }> => {
  // 验证分页参数
  validatePaginationParams(page, limit);

  const query = db('orders').where({ user_id: userId });

  if (status) {
    query.where({ status });
  }

  // Get total count
  const countResult = await query.clone().count('* as count').first();
  const total = parseInt(countResult?.count as string, 10) || 0;

  // Get orders with pagination
  const orders = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit)
    .select('*');

  return {
    orders: orders.map(formatOrder),
    total,
  };
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string, userId: string): Promise<Order> => {
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  return formatOrder(order);
};

/**
 * Create a new order
 */
export const createOrder = async (
  userId: string,
  planId: string,
  paymentMethod?: string
): Promise<Order> => {
  // Validate plan
  const plan = await db('subscription_plans')
    .where({ plan_id: planId })
    .first();

  if (!plan) {
    throw new NotFoundError('Subscription plan', planId);
  }

  if (plan.status !== 1) {
    throw new ValidationError([{ field: 'planId', message: 'This plan is not available' }]);
  }

  // Check if user has pending order for same plan
  const existingPendingOrder = await db('orders')
    .where({
      user_id: userId,
      plan_id: planId,
      status: ORDER_STATUS.PENDING,
    })
    .first();

  if (existingPendingOrder) {
    throw new ConflictError('You already have a pending order for this plan');
  }

  // Calculate order dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  // 解析套餐的服务类型
  let serviceTypes: ServiceType[] = [ServiceType.STANDARD];
  if (plan.service_types) {
    if (typeof plan.service_types === 'string') {
      try {
        serviceTypes = JSON.parse(plan.service_types);
      } catch {
        serviceTypes = [plan.service_types as ServiceType];
      }
    } else if (Array.isArray(plan.service_types)) {
      serviceTypes = plan.service_types;
    }
  }

  // Create order
  const orderId = generateOrderId();
  const orderNo = generateOrderNo();

  await db('orders').insert({
    order_id: orderId,
    order_no: orderNo,
    user_id: userId,
    plan_id: planId,
    order_type: 'subscription',
    status: ORDER_STATUS.PENDING,
    amount: plan.price,
    traffic_limit: plan.traffic_limit,
    duration_days: plan.duration_days,
    service_types: JSON.stringify(serviceTypes),
    start_date: startDate,
    end_date: endDate,
    payment_method: paymentMethod || null,
    payment_time: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Return created order
  const order = await db('orders').where({ order_id: orderId }).first();
  return formatOrder(order);
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string, userId: string): Promise<Order> => {
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  // Only pending orders can be cancelled
  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ValidationError([
      { field: 'status', message: `Cannot cancel order with status: ${order.status}` },
    ]);
  }

  await db('orders')
    .where({ order_id: orderId })
    .update({
      status: ORDER_STATUS.CANCELLED,
      updated_at: new Date(),
    });

  const updatedOrder = await db('orders').where({ order_id: orderId }).first();
  return formatOrder(updatedOrder);
};

/**
 * Get payment information for an order
 */
export const getPaymentInfo = async (
  orderId: string,
  userId: string
): Promise<PaymentInfo> => {
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  // Check if order can be paid
  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ValidationError([
      { field: 'status', message: `Order is not in pending status: ${order.status}` },
    ]);
  }

  const paymentMethod = order.payment_method || 'stripe';

  // Generate payment URL based on payment method
  let paymentUrl: string | undefined;
  let qrCode: string | undefined;

  const basePaymentUrl = process.env.PAYMENT_BASE_URL || 'https://pay.embarks.uk';

  switch (paymentMethod) {
    case 'stripe':
      paymentUrl = `${basePaymentUrl}/stripe/${order.order_no}`;
      break;
    case 'paypal':
      paymentUrl = `${basePaymentUrl}/paypal/${order.order_no}`;
      break;
    case 'alipay':
      qrCode = `${basePaymentUrl}/alipay/qr/${order.order_no}`;
      break;
    case 'wechat':
      qrCode = `${basePaymentUrl}/wechat/qr/${order.order_no}`;
      break;
    default:
      paymentUrl = `${basePaymentUrl}/pay/${order.order_no}`;
  }

  // Set expiration to 30 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  return {
    orderId: order.order_id,
    orderNo: order.order_no,
    amount: parseFloat(order.amount),
    paymentMethod,
    paymentUrl,
    qrCode,
    expiresAt: expiresAt.toISOString(),
  };
};

/**
 * Verify payment status for an order
 */
export const verifyPayment = async (
  orderId: string,
  userId: string
): Promise<{ order: Order; paymentStatus: string }> => {
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  let paymentStatus: string;

  if (order.status === ORDER_STATUS.COMPLETED) {
    paymentStatus = PAYMENT_STATUS.SUCCESS;
  } else if (order.status === ORDER_STATUS.CANCELLED) {
    paymentStatus = PAYMENT_STATUS.FAILED;
  } else if (order.status === ORDER_STATUS.PENDING) {
    // Check if there's a payment record
    const payment = await db('payments')
      .where({ order_id: orderId })
      .orderBy('created_at', 'desc')
      .first();

    if (payment) {
      paymentStatus = payment.status;

      // If payment is successful but order is still pending, update order
      if (paymentStatus === PAYMENT_STATUS.SUCCESS) {
        await db('orders')
          .where({ order_id: orderId })
          .update({
            status: ORDER_STATUS.COMPLETED,
            payment_time: new Date(),
            updated_at: new Date(),
          });

        // Update user's subscription
        await updateUserSubscription(userId, order);
      }
    } else {
      // No payment record found, check if order has expired
      const orderTime = new Date(order.created_at).getTime();
      const now = Date.now();
      const expireMinutes = 30;
      if (now - orderTime > expireMinutes * 60 * 1000) {
        // Order expired
        await db('orders')
          .where({ order_id: orderId })
          .update({
            status: ORDER_STATUS.CANCELLED,
            updated_at: new Date(),
          });
        paymentStatus = PAYMENT_STATUS.FAILED;
      } else {
        paymentStatus = PAYMENT_STATUS.PENDING;
      }
    }
  } else {
    paymentStatus = PAYMENT_STATUS.PENDING;
  }

  const updatedOrder = await db('orders').where({ order_id: orderId }).first();
  return {
    order: formatOrder(updatedOrder),
    paymentStatus,
  };
};

/**
 * Update user subscription after successful payment
 */
const updateUserSubscription = async (
  userId: string,
  order: Record<string, unknown>
): Promise<void> => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (order.duration_days as number));

  // 解析订单中的服务类型
  let serviceTypes: ServiceType[] = [ServiceType.STANDARD];
  if (order.service_types) {
    if (typeof order.service_types === 'string') {
      try {
        serviceTypes = JSON.parse(order.service_types);
      } catch {
        serviceTypes = [order.service_types as ServiceType];
      }
    } else if (Array.isArray(order.service_types)) {
      serviceTypes = order.service_types as ServiceType[];
    }
  }

  // Check if user has existing subscription
  const existingSubscription = await db('user_subscriptions')
    .where({ user_id: userId, status: 'active' })
    .first();

  if (existingSubscription) {
    // 获取现有订阅的服务类型
    let existingServiceTypes: ServiceType[] = [ServiceType.STANDARD];
    if (existingSubscription.service_types) {
      if (typeof existingSubscription.service_types === 'string') {
        try {
          existingServiceTypes = JSON.parse(existingSubscription.service_types);
        } catch {
          existingServiceTypes = [existingSubscription.service_types as ServiceType];
        }
      } else if (Array.isArray(existingSubscription.service_types)) {
        existingServiceTypes = existingSubscription.service_types;
      }
    }

    // 合并服务类型（取并集）
    const mergedServiceTypes = [...new Set([...existingServiceTypes, ...serviceTypes])];

    // Extend existing subscription
    const currentEndDate = new Date(existingSubscription.end_date);
    const newEndDate = currentEndDate > now ? currentEndDate : now;
    newEndDate.setDate(newEndDate.getDate() + (order.duration_days as number));

    await db('user_subscriptions')
      .where({ id: existingSubscription.id })
      .update({
        end_date: newEndDate,
        traffic_limit: (existingSubscription.traffic_limit || 0) + (order.traffic_limit as number),
        service_types: JSON.stringify(mergedServiceTypes),
        updated_at: now,
      });
  } else {
    // Create new subscription
    await db('user_subscriptions').insert({
      user_id: userId,
      plan_id: order.plan_id,
      status: 'active',
      traffic_limit: order.traffic_limit,
      traffic_used: 0,
      service_types: JSON.stringify(serviceTypes),
      start_date: now,
      end_date: endDate,
      created_at: now,
      updated_at: now,
    });
  }

  // Update user's traffic limit and expire date
  const user = await db('users').where({ user_id: userId }).first();
  const currentExpireDate = user?.expire_date ? new Date(user.expire_date) : null;
  const newExpireDate =
    currentExpireDate && currentExpireDate > now
      ? new Date(
          currentExpireDate.getTime() + (order.duration_days as number) * 24 * 60 * 60 * 1000
        )
      : endDate;

  // 更新用户有效的服务类型（取现有和新的并集）
  let currentEffectiveTypes: ServiceType[] = [ServiceType.STANDARD];
  if (user?.effective_service_types) {
    if (typeof user.effective_service_types === 'string') {
      try {
        currentEffectiveTypes = JSON.parse(user.effective_service_types);
      } catch {
        currentEffectiveTypes = [user.effective_service_types as ServiceType];
      }
    } else if (Array.isArray(user.effective_service_types)) {
      currentEffectiveTypes = user.effective_service_types;
    }
  }

  const mergedEffectiveTypes = [...new Set([...currentEffectiveTypes, ...serviceTypes])];

  await db('users')
    .where({ user_id: userId })
    .update({
      traffic_limit: (user?.traffic_limit || 0) + (order.traffic_limit as number),
      expire_date: newExpireDate,
      effective_service_types: JSON.stringify(mergedEffectiveTypes),
      updated_at: now,
    });
};
