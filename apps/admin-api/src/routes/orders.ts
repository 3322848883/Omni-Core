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

// GET /api/v1/orders - Get all orders with pagination and filters
router.get('/', authMiddleware, validate(OrderValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let query = db('orders');

    if (status) {
      query = query.where('status', status);
    }

    if (userId) {
      query = query.where('user_id', userId);
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
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: orders.map(order => ({
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
          updatedAt: order.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
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
      changed_by: req.user?.username || 'system',
      reason: 'Order created'
    });

    logger.info(`Order created: ${orderNo} for user ${userId} by ${req.user?.username || 'system'}`);

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

    logger.info(`Order updated: ${order.order_no} by ${req.user?.username || 'system'}`);

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
      changed_by: req.user?.username || 'system',
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

    logger.info(`Order paid: ${order.order_no} by ${req.user?.username || 'system'}`);

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
      changed_by: req.user?.username || 'system',
      reason: reason || 'Order cancelled'
    });

    logger.info(`Order cancelled: ${order.order_no} by ${req.user?.username || 'system'}`);

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
      changed_by: req.user?.username || 'system',
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

    logger.info(`Order refunded: ${order.order_no} by ${req.user?.username || 'system'}`);

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
      req.user?.username || 'system'
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

// GET /api/v1/orders/stats/time-series - Get time series data
router.get('/stats/time-series', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'day', startDate, endDate } = req.query;
    const validPeriods = ['day', 'week', 'month', 'quarter', 'year'];
    
    if (!validPeriods.includes(period as string)) {
      throw new ValidationError('Invalid period', [
        { field: 'period', message: 'Invalid period. Must be one of: day, week, month, quarter, year' }
      ]);
    }

    let dateFormat = '';
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u'; // ISO week number
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'quarter':
        dateFormat = '%Y-%m'; // We'll group by quarter later
        break;
      case 'year':
        dateFormat = '%Y';
        break;
    }

    let query = db('orders')
      .select(
        db.raw(`DATE_FORMAT(created_at, '${dateFormat}') as period`),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as orderCount')
      )
      .where('status', 'completed');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    if (period === 'quarter') {
      // For quarter, we need to extract quarter from date
      query = db('orders')
        .select(
          db.raw('CONCAT(YEAR(created_at), "-Q", QUARTER(created_at)) as period'),
          db.raw('SUM(amount) as revenue'),
          db.raw('COUNT(*) as orderCount')
        )
        .where('status', 'completed');

      if (startDate) {
        query = query.where('created_at', '>=', startDate);
      }

      if (endDate) {
        query = query.where('created_at', '<=', endDate);
      }
    }

    const results = await query
      .groupBy('period')
      .orderBy('period');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        period: period as string,
        series: results.map(item => ({
          period: item.period,
          revenue: parseFloat(item.revenue as string) || 0,
          orderCount: parseInt(item.orderCount as string) || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats/payment-methods - Get payment method analysis
router.get('/stats/payment-methods', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db('orders')
      .select(
        'payment_method',
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as orderCount')
      )
      .where('status', 'completed')
      .whereNotNull('payment_method');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const results = await query
      .groupBy('payment_method')
      .orderBy('revenue', 'desc');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        paymentMethods: results.map(item => ({
          paymentMethod: item.payment_method,
          revenue: parseFloat(item.revenue as string) || 0,
          orderCount: parseInt(item.orderCount as string) || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats/order-types - Get order type analysis
router.get('/stats/order-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db('orders')
      .select(
        'order_type',
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as orderCount')
      )
      .where('status', 'completed');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const results = await query
      .groupBy('order_type')
      .orderBy('revenue', 'desc');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        orderTypes: results.map(item => ({
          orderType: item.order_type,
          revenue: parseFloat(item.revenue as string) || 0,
          orderCount: parseInt(item.orderCount as string) || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats/users - Get user analysis
router.get('/stats/users', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    let query = db('orders')
      .select(
        'user_id',
        db.raw('SUM(amount) as totalSpent'),
        db.raw('COUNT(*) as orderCount')
      )
      .where('status', 'completed');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const topUsers = await query
      .groupBy('user_id')
      .orderBy('totalSpent', 'desc')
      .limit(parseInt(limit as string));

    // Get new user count (users who made their first order in the period)
    let newUserQuery = db('orders as o1')
      .select(
        'o1.user_id',
        db.raw('MIN(o1.created_at) as firstOrderDate')
      )
      .where('o1.status', 'completed');

    if (startDate) {
      newUserQuery = newUserQuery.where('o1.created_at', '>=', startDate);
    }

    if (endDate) {
      newUserQuery = newUserQuery.where('o1.created_at', '<=', endDate);
    }

    const newUsers = await newUserQuery
      .groupBy('o1.user_id')
      .having(db.raw('MIN(o1.created_at) >= ?', [startDate || '2000-01-01']));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        topUsers: topUsers.map(user => ({
          userId: user.user_id,
          totalSpent: parseFloat(user.totalSpent as string) || 0,
          orderCount: parseInt(user.orderCount as string) || 0
        })),
        newUserCount: newUsers.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/stats/detailed - Get detailed stats with filters
router.get('/stats/detailed', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, paymentMethod, orderType, status } = req.query;

    let query = db('orders');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    if (paymentMethod) {
      query = query.where('payment_method', paymentMethod);
    }

    if (orderType) {
      query = query.where('order_type', orderType);
    }

    if (status) {
      query = query.where('status', status);
    }

    const stats = await query
      .sum('amount as totalRevenue')
      .count('* as totalOrders')
      .first();

    const statusDistribution = await query
      .select('status')
      .count('* as count')
      .groupBy('status');

    const paymentMethodDistribution = await query
      .select('payment_method')
      .count('* as count')
      .whereNotNull('payment_method')
      .groupBy('payment_method');

    const orderTypeDistribution = await query
      .select('order_type')
      .count('* as count')
      .groupBy('order_type');

    const totalRevenue = stats ? parseFloat(stats.totalRevenue as string) || 0 : 0;
    const totalOrders = stats ? parseInt(stats.totalOrders as string) || 0 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        statusDistribution: statusDistribution.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        paymentMethodDistribution: paymentMethodDistribution.reduce((acc, curr) => {
          acc[curr.payment_method] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        orderTypeDistribution: orderTypeDistribution.reduce((acc, curr) => {
          acc[curr.order_type] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as orderRoutes };
