import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { config } from '../config';
import {
  createPayment,
  processRefund,
  getPaymentStatus,
  getAvailableProviders,
  getQRCodeInfo,
  PaymentProvider,
} from '../services/payment';
import { emailService } from '../services/email';
import { authMiddleware } from '../middlewares/auth';
import { validate, OrderValidation } from '../middlewares/validation';
import {
  getPendingConfirmationOrders,
  confirmOrderPayment,
  rejectOrderPayment,
  getPendingConfirmationCount,
} from '../services/order-confirmation.service';

const router = Router();

// Generate order number
function generateOrderNo(): string {
  const date = new Date();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORD${dateStr}${random}`;
}

// 状态映射函数：字符串转数字
function mapStatusToNumber(status: string): number {
  const statusMap: Record<string, number> = {
    'pending': 1,
    'completed': 2,
    'cancelled': 3,
    'refunded': 4,
  };
  return statusMap[status] || 0;
}

// 支付方式映射函数
function mapPaymentMethod(method: string | null): string {
  if (!method) return '';
  const methodMap: Record<string, string> = {
    'alipay': 'alipay',
    'wechat': 'wechat',
    'alipay_personal': 'qrcode',
    'wechat_personal': 'qrcode',
    'qrcode': 'qrcode',
    'card': 'card',
  };
  return methodMap[method] || method;
}

// GET /api/v1/orders - Get all orders with pagination and filters
router.get('/', authMiddleware, validate(OrderValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * pageSize;
    const status = req.query.status as string;
    const userId = req.query.userId as string;
    const orderNo = req.query.orderNo as string;
    const keyword = req.query.keyword as string;
    const username = req.query.username as string;
    const paymentMethod = req.query.paymentMethod as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let query = db('orders');

    // 支持多种状态查询方式
    if (status) {
      const statusNum = parseInt(status, 10);
      if (!isNaN(statusNum)) {
        // 数字状态需要反向映射到字符串
        const statusStrMap: Record<number, string> = {
          1: 'pending',
          2: 'completed',
          3: 'cancelled',
          4: 'refunded',
        };
        const statusStr = statusStrMap[statusNum];
        if (statusStr) {
          query = query.where('status', statusStr);
        }
      } else {
        query = query.where('status', status);
      }
    }

    if (userId) {
      query = query.where('user_id', userId);
    }

    // 支持订单号查询
    if (orderNo) {
      query = query.where('order_no', 'like', `%${orderNo}%`);
    }

    // 支持关键字查询（订单号）
    if (keyword) {
      query = query.where('order_no', 'like', `%${keyword}%`);
    }

    // 支持用户名查询（需要关联 users 表）
    if (username) {
      query = query.whereExists(function() {
        this.select('*')
          .from('users')
          .whereRaw('users.user_id = orders.user_id')
          .andWhere(function() {
            this.where('username', 'like', `%${username}%`)
              .orWhere('email', 'like', `%${username}%`);
          });
      });
    }

    // 支持支付方式查询
    if (paymentMethod) {
      if (paymentMethod === 'qrcode') {
        query = query.whereIn('payment_method', ['alipay_personal', 'wechat_personal', 'qrcode']);
      } else {
        query = query.where('payment_method', paymentMethod);
      }
    }

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);

    const orders = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    // 获取用户信息
    const userIds = Array.from(new Set(orders.map(o => o.user_id)));
    const users = await db('users')
      .whereIn('user_id', userIds)
      .select('user_id', 'username', 'email');
    const userMap = new Map(users.map(u => [u.user_id, u]));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        list: orders.map(order => {
          const user = userMap.get(order.user_id);
          return {
            id: order.id,
            orderNo: order.order_no,
            userId: order.user_id,
            username: user?.username || '',
            email: user?.email || '',
            orderType: order.order_type,
            status: mapStatusToNumber(order.status),
            amount: order.amount,
            trafficLimit: order.traffic_limit,
            durationDays: order.duration_days,
            startDate: order.start_date,
            endDate: order.end_date,
            paymentMethod: mapPaymentMethod(order.payment_method),
            paymentTime: order.payment_time,
            createdAt: order.created_at,
            updatedAt: order.updated_at
          };
        }),
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id - Get order by ID
router.get('/:id', authMiddleware, validate(OrderValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    const orderStatusLogs = await db('order_status_logs')
      .where('order_id', order.id)
      .orderBy('created_at', 'asc')
      .select('*');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        id: order.id,
        orderNo: order.order_no,
        userId: order.user_id,
        orderType: order.order_type,
        status: order.status,
        amount: order.amount,
        trafficLimit: order.traffic_limit,
        durationDays: order.duration_days,
        startDate: order.start_date,
        endDate: order.end_date,
        paymentMethod: order.payment_method,
        paymentTime: order.payment_time,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        statusHistory: orderStatusLogs.map(log => ({
          fromStatus: log.from_status,
          toStatus: log.to_status,
          changedBy: log.changed_by,
          reason: log.reason,
          createdAt: log.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders - Create new order
router.post('/', authMiddleware, validate(OrderValidation.create), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, orderType, amount, trafficLimit, durationDays } = req.body;

    const user = await db('users')
      .where('user_id', userId)
      .where('status', '!=', 3)
      .first();

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const orderNo = generateOrderNo();

    const [order] = await db('orders').insert({
      order_no: orderNo,
      user_id: userId,
      order_type: orderType,
      status: 'pending',
      amount,
      traffic_limit: trafficLimit || null,
      duration_days: durationDays || null,
      start_date: null,
      end_date: null,
      payment_method: null,
      payment_time: null
    }).returning('*');

    await db('order_status_logs').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      changed_by: req.user?.email || 'system',
      reason: 'Order created'
    });

    logger.info(`Order created: ${orderNo} for user ${userId} by ${req.user?.email || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Order created successfully',
      data: {
        id: order.id,
        orderNo: order.order_no,
        userId: order.user_id,
        orderType: order.order_type,
        status: order.status,
        amount: order.amount,
        trafficLimit: order.traffic_limit,
        durationDays: order.duration_days,
        startDate: order.start_date,
        endDate: order.end_date,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/orders/:id - Update order
router.put('/:id', authMiddleware, validate(OrderValidation.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, trafficLimit, durationDays, startDate, endDate } = req.body;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: 'Only pending orders can be updated' }
      ]);
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (amount !== undefined) {updateData.amount = amount;}
    if (trafficLimit !== undefined) {updateData.traffic_limit = trafficLimit;}
    if (durationDays !== undefined) {updateData.duration_days = durationDays;}
    if (startDate !== undefined) {updateData.start_date = startDate;}
    if (endDate !== undefined) {updateData.end_date = endDate;}

    const [updatedOrder] = await db('orders')
      .where('id', order.id)
      .update(updateData)
      .returning('*');

    logger.info(`Order updated: ${order.order_no} by ${req.user?.email || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Order updated successfully',
      data: {
        id: updatedOrder.id,
        orderNo: updatedOrder.order_no,
        userId: updatedOrder.user_id,
        orderType: updatedOrder.order_type,
        status: updatedOrder.status,
        amount: updatedOrder.amount,
        trafficLimit: updatedOrder.traffic_limit,
        durationDays: updatedOrder.duration_days,
        startDate: updatedOrder.start_date,
        endDate: updatedOrder.end_date,
        createdAt: updatedOrder.created_at,
        updatedAt: updatedOrder.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/pay - Mark order as paid
router.post('/:id/pay', authMiddleware, validate(OrderValidation.pay), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: 'Only pending orders can be paid' }
      ]);
    }

    const now = new Date();
    const startDate = now;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (order.duration_days || 30));

    await db('orders')
      .where('id', order.id)
      .update({
        status: 'completed',
        payment_method: paymentMethod || 'manual',
        payment_time: now,
        start_date: startDate,
        end_date: endDate,
        updated_at: now
      });

    await db('order_status_logs').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'completed',
      changed_by: req.user?.email || 'system',
      reason: 'Payment received'
    });

    if (order.traffic_limit) {
      await db('users')
        .where('user_id', order.user_id)
        .update({
          traffic_limit: db.raw('traffic_limit + ?', [order.traffic_limit]),
          expire_date: endDate,
          updated_at: now
        });
    }

    logger.info(`Order paid: ${order.order_no} by ${req.user?.email || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Order paid successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/cancel - Cancel order
router.post('/:id/cancel', authMiddleware, validate(OrderValidation.cancel), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: 'Only pending orders can be cancelled' }
      ]);
    }

    await db('orders')
      .where('id', order.id)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });

    await db('order_status_logs').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'cancelled',
      changed_by: req.user?.email || 'system',
      reason: reason || 'Order cancelled'
    });

    logger.info(`Order cancelled: ${order.order_no} by ${req.user?.email || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/refund - Refund order
router.post('/:id/refund', authMiddleware, validate(OrderValidation.refund), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    if (order.status !== 'completed') {
      throw new ValidationError([
        { field: 'status', message: 'Only completed orders can be refunded' }
      ]);
    }

    await db('orders')
      .where('id', order.id)
      .update({
        status: 'refunded',
        updated_at: new Date()
      });

    await db('order_status_logs').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'refunded',
      changed_by: req.user?.email || 'system',
      reason: reason || 'Order refunded'
    });

    if (order.traffic_limit) {
      await db('users')
        .where('user_id', order.user_id)
        .update({
          traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
          updated_at: new Date()
        });
    }

    logger.info(`Order refunded: ${order.order_no} by ${req.user?.email || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Order refunded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/payment - Create payment for order
router.post('/:id/payment', authMiddleware, validate(OrderValidation.createPayment), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { provider, returnUrl, cancelUrl } = req.body;

    // Validate provider
    if (!provider || !['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'].includes(provider)) {
      throw new ValidationError([
        { field: 'provider', message: 'Valid payment provider (stripe, paypal, alipay, wechat, alipay_merchant, or wechat_merchant) is required' }
      ]);
    }

    // Check if provider is available
    const availableProviders = getAvailableProviders();
    if (!availableProviders.includes(provider as PaymentProvider)) {
      throw new ValidationError([
        { field: 'provider', message: `Payment provider ${provider} is not available` }
      ]);
    }

    // Find order
    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    // Check if order can be paid
    if (order.status !== 'pending') {
      throw new ValidationError([
        { field: 'status', message: 'Only pending orders can be paid' }
      ]);
    }

    // Get user info for description
    const user = await db('users')
      .where('user_id', order.user_id)
      .first();

    const description = `FGVPN ${order.order_type} plan for ${user?.email || order.user_id}`;
    const currency = config.payment?.defaultCurrency || 'USD';

    // Create payment
    const paymentResponse = await createPayment(provider as PaymentProvider, {
      orderId: order.id.toString(),
      orderNo: order.order_no,
      userId: order.user_id,
      amount: parseFloat(order.amount),
      currency,
      description,
      returnUrl: returnUrl || `${config.adminWebUrl}/orders/success`,
      cancelUrl: cancelUrl || `${config.adminWebUrl}/orders/cancel`,
      metadata: {
        orderType: order.order_type,
        trafficLimit: order.traffic_limit?.toString() || '',
        durationDays: order.duration_days?.toString() || '',
      }
    });

    logger.info(`Payment created for order: ${order.order_no} using ${provider}`);

    // 发送支付通知邮件给管理员（所有支付方式）
    const adminEmail = config.smtp?.adminEmail || config.smtp?.user;
    if (adminEmail && emailService.isEmailConfigured()) {
      try {
        await emailService.sendPaymentSuccessNotification({
          adminEmail,
          orderNo: order.order_no,
          orderId: order.id.toString(),
          userEmail: user?.email || 'unknown',
          userId: order.user_id,
          amount: parseFloat(order.amount),
          currency,
          paymentMethod: provider,
          paymentTime: new Date(),
        });
        logger.info(`Payment notification email sent for order: ${order.order_no}`);
      } catch (emailError) {
        logger.error('Failed to send payment notification email:', emailError);
        // 邮件发送失败不影响支付流程
      }
    } else {
      logger.warn('Email service not configured or admin email not set. Skipping notification.');
    }

    res.json({
      success: true,
      code: 200,
      message: 'Payment created successfully',
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        provider: paymentResponse.provider,
        clientSecret: paymentResponse.clientSecret,
        checkoutUrl: paymentResponse.checkoutUrl,
        paymentIntentId: paymentResponse.paymentIntentId,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id/payment-status - Get payment status
router.get('/:id/payment-status', authMiddleware, validate(OrderValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    // If no payment has been initiated
    if (!order.payment_method || !order.payment_id) {
      return res.json({
        success: true,
        code: 200,
        message: 'success',
        data: {
          orderId: order.id,
          orderNo: order.order_no,
          status: order.status,
          paymentStatus: null,
          provider: null,
        }
      });
    }

    // Get payment status from provider
    const paymentStatus = await getPaymentStatus(
      order.payment_method as PaymentProvider,
      order.payment_id
    );

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        paymentStatus: paymentStatus.status,
        provider: order.payment_method,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        paidAt: paymentStatus.paidAt,
        providerOrderId: paymentStatus.providerOrderId,
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/refund - Refund order (with payment provider)
router.post('/:id/payment-refund', authMiddleware, validate(OrderValidation.paymentRefund), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = await db('orders')
      .where('id', id)
      .orWhere('order_no', id)
      .first();

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    // Check if order has payment information
    if (!order.payment_method || !order.payment_id) {
      throw new ValidationError([
        { field: 'payment', message: 'Order does not have payment information' }
      ]);
    }

    // Process refund through payment provider
    const refundResult = await processRefund(
      order.id.toString(),
      amount,
      reason,
      req.user?.email || 'system'
    );

    res.json({
      success: refundResult.success,
      code: refundResult.success ? 200 : 400,
      message: refundResult.success ? 'Refund processed successfully' : 'Refund failed',
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        refundId: refundResult.refundId,
        amount: refundResult.amount,
        status: refundResult.status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/payment/providers - Get available payment providers
router.get('/payment/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = getAvailableProviders();

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        providers: providers.map(provider => ({
          id: provider,
          name: provider.charAt(0).toUpperCase() + provider.slice(1),
          enabled: true,
        })),
        defaultCurrency: config.payment?.defaultCurrency || 'USD',
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/payment/qrcode/:provider - Get QR code info for payment
router.get('/payment/qrcode/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!['alipay', 'wechat'].includes(provider)) {
      throw new ValidationError([
        { field: 'provider', message: 'Provider must be alipay or wechat' }
      ]);
    }

    // Check if provider is available
    const availableProviders = getAvailableProviders();
    if (!availableProviders.includes(provider as PaymentProvider)) {
      throw new ValidationError([
        { field: 'provider', message: `Payment provider ${provider} is not available` }
      ]);
    }

    // Get QR code info
    const qrCodeInfo = getQRCodeInfo(provider as PaymentProvider);

    if (!qrCodeInfo || !qrCodeInfo.qrCodeUrl) {
      throw new ValidationError([
        { field: 'provider', message: `QR code for ${provider} is not configured` }
      ]);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        provider,
        qrCodeUrl: qrCodeInfo.qrCodeUrl,
        receiverName: qrCodeInfo.receiverName,
        instructions: qrCodeInfo.instructions,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats - Get order statistics (for frontend)
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pendingCount = await getPendingConfirmationCount();
    
    // 获取各状态订单数量
    const statusCounts = await db('orders')
      .select('status')
      .count('* as count')
      .groupBy('status');
    
    const statusCountMap = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count as string);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        pendingOrders: pendingCount,
        pending: statusCountMap['pending'] || 0,
        completed: statusCountMap['completed'] || 0,
        cancelled: statusCountMap['cancelled'] || 0,
        refunded: statusCountMap['refunded'] || 0,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats/overview - Get order statistics
router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7) + '-01';

    const [todayStats] = await db('orders')
      .where('created_at', '>=', today)
      .where('status', 'completed')
      .sum('amount as total')
      .count('* as count');

    const [monthStats] = await db('orders')
      .where('created_at', '>=', thisMonth)
      .where('status', 'completed')
      .sum('amount as total')
      .count('* as count');

    const [totalStats] = await db('orders')
      .where('status', 'completed')
      .sum('amount as total')
      .count('* as count');

    const pendingCount = await db('orders')
      .where('status', 'pending')
      .count('* as count')
      .first();

    const statusCounts = await db('orders')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const recentOrders = await db('orders')
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        today: {
          revenue: parseFloat(todayStats.total as string) || 0,
          count: parseInt(todayStats.count as string) || 0
        },
        thisMonth: {
          revenue: parseFloat(monthStats.total as string) || 0,
          count: parseInt(monthStats.count as string) || 0
        },
        total: {
          revenue: parseFloat(totalStats.total as string) || 0,
          count: parseInt(totalStats.count as string) || 0
        },
        pendingCount: parseInt(pendingCount?.count as string) || 0,
        statusDistribution: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNo: order.order_no,
          userId: order.user_id,
          status: order.status,
          amount: order.amount,
          createdAt: order.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/orders/pending-confirmation - 获取待确认订单列表
// 条件：payment_method 为 wechat_personal 或 alipay_personal 且状态为 pending
router.get('/pending-confirmation', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getPendingConfirmationOrders(page, limit);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: result.items.map(order => ({
          id: order.id,
          orderNo: order.orderNo,
          userId: order.userId,
          orderType: order.orderType,
          status: order.status,
          amount: order.amount,
          trafficLimit: order.trafficLimit,
          durationDays: order.durationDays,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          user: order.user,
          paymentProof: order.paymentProof ? {
            id: order.paymentProof.id,
            imageUrl: order.paymentProof.imageUrl,
            remark: order.paymentProof.remark,
            status: order.paymentProof.status,
            createdAt: order.paymentProof.createdAt,
          } : null,
        })),
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/orders/:id/confirm - 确认收款
router.post('/:id/confirm', authMiddleware, validate({
  params: {
    id: {
      required: true,
      type: 'string',
    },
  },
  body: {
    remark: {
      type: 'string',
      max: 500,
    },
  },
}), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const adminId = req.user?.sub ? parseInt(req.user.sub, 10) : 0;
    const adminUsername = req.user?.email || 'system';

    const result = await confirmOrderPayment(id, adminId, adminUsername, remark);

    res.json({
      success: true,
      code: 200,
      message: '订单确认收款成功',
      data: {
        orderId: result.orderId,
        orderNo: result.orderNo,
        newStatus: result.newStatus,
        userUpdated: result.userUpdated,
        subscriptionUpdated: result.subscriptionUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/orders/:id/reject - 拒绝收款
router.post('/:id/reject', authMiddleware, validate({
  params: {
    id: {
      required: true,
      type: 'string',
    },
  },
  body: {
    reason: {
      required: true,
      type: 'string',
      max: 500,
    },
  },
}), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.sub ? parseInt(req.user.sub, 10) : 0;
    const adminUsername = req.user?.email || 'system';

    const result = await rejectOrderPayment(id, adminId, adminUsername, reason);

    res.json({
      success: true,
      code: 200,
      message: '订单已拒绝收款',
      data: {
        orderId: result.orderId,
        orderNo: result.orderNo,
        newStatus: result.newStatus,
        reason: result.reason,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/orders/pending-confirmation/count - 获取待确认订单数量
router.get('/pending-confirmation/count', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await getPendingConfirmationCount();

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        count,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as orderRoutes };
