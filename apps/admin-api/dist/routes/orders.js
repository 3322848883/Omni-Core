"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
const payment_1 = require("../services/payment");
const email_1 = require("../services/email");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
exports.orderRoutes = router;
// Generate order number
function generateOrderNo() {
    const date = new Date();
    const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ORD${dateStr}${random}`;
}
// GET /api/v1/orders - Get all orders with pagination and filters
router.get('/', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.list), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const userId = req.query.userId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let query = (0, database_1.db)('orders');
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
        const total = parseInt(countResult.count);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/orders/:id - Get order by ID
router.get('/:id', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        const orderStatusLogs = await (0, database_1.db)('order_status_logs')
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders - Create new order
router.post('/', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.create), async (req, res, next) => {
    try {
        const { userId, orderType, amount, trafficLimit, durationDays } = req.body;
        const user = await (0, database_1.db)('users')
            .where('user_id', userId)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', userId);
        }
        const orderNo = generateOrderNo();
        const [order] = await (0, database_1.db)('orders').insert({
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
        await (0, database_1.db)('order_status_logs').insert({
            order_id: order.id,
            from_status: null,
            to_status: 'pending',
            changed_by: req.user?.username || 'system',
            reason: 'Order created'
        });
        logger_1.logger.info(`Order created: ${orderNo} for user ${userId} by ${req.user?.username || 'system'}`);
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
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/v1/orders/:id - Update order
router.put('/:id', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.update), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, trafficLimit, durationDays, startDate, endDate } = req.body;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        if (order.status !== 'pending') {
            throw new errors_1.ValidationError([
                { field: 'status', message: 'Only pending orders can be updated' }
            ]);
        }
        const updateData = {
            updated_at: new Date()
        };
        if (amount !== undefined) {
            updateData.amount = amount;
        }
        if (trafficLimit !== undefined) {
            updateData.traffic_limit = trafficLimit;
        }
        if (durationDays !== undefined) {
            updateData.duration_days = durationDays;
        }
        if (startDate !== undefined) {
            updateData.start_date = startDate;
        }
        if (endDate !== undefined) {
            updateData.end_date = endDate;
        }
        const [updatedOrder] = await (0, database_1.db)('orders')
            .where('id', order.id)
            .update(updateData)
            .returning('*');
        logger_1.logger.info(`Order updated: ${order.order_no} by ${req.user?.username || 'system'}`);
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders/:id/pay - Mark order as paid
router.post('/:id/pay', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.pay), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentMethod } = req.body;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        if (order.status !== 'pending') {
            throw new errors_1.ValidationError([
                { field: 'status', message: 'Only pending orders can be paid' }
            ]);
        }
        const now = new Date();
        const startDate = now;
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + (order.duration_days || 30));
        await (0, database_1.db)('orders')
            .where('id', order.id)
            .update({
            status: 'completed',
            payment_method: paymentMethod || 'manual',
            payment_time: now,
            start_date: startDate,
            end_date: endDate,
            updated_at: now
        });
        await (0, database_1.db)('order_status_logs').insert({
            order_id: order.id,
            from_status: order.status,
            to_status: 'completed',
            changed_by: req.user?.username || 'system',
            reason: 'Payment received'
        });
        if (order.traffic_limit) {
            await (0, database_1.db)('users')
                .where('user_id', order.user_id)
                .update({
                traffic_limit: database_1.db.raw('traffic_limit + ?', [order.traffic_limit]),
                expire_date: endDate,
                updated_at: now
            });
        }
        logger_1.logger.info(`Order paid: ${order.order_no} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Order paid successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders/:id/cancel - Cancel order
router.post('/:id/cancel', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.cancel), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        if (order.status !== 'pending') {
            throw new errors_1.ValidationError([
                { field: 'status', message: 'Only pending orders can be cancelled' }
            ]);
        }
        await (0, database_1.db)('orders')
            .where('id', order.id)
            .update({
            status: 'cancelled',
            updated_at: new Date()
        });
        await (0, database_1.db)('order_status_logs').insert({
            order_id: order.id,
            from_status: order.status,
            to_status: 'cancelled',
            changed_by: req.user?.username || 'system',
            reason: reason || 'Order cancelled'
        });
        logger_1.logger.info(`Order cancelled: ${order.order_no} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Order cancelled successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders/:id/refund - Refund order
router.post('/:id/refund', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.refund), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        if (order.status !== 'completed') {
            throw new errors_1.ValidationError([
                { field: 'status', message: 'Only completed orders can be refunded' }
            ]);
        }
        await (0, database_1.db)('orders')
            .where('id', order.id)
            .update({
            status: 'refunded',
            updated_at: new Date()
        });
        await (0, database_1.db)('order_status_logs').insert({
            order_id: order.id,
            from_status: order.status,
            to_status: 'refunded',
            changed_by: req.user?.username || 'system',
            reason: reason || 'Order refunded'
        });
        if (order.traffic_limit) {
            await (0, database_1.db)('users')
                .where('user_id', order.user_id)
                .update({
                traffic_limit: database_1.db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
                updated_at: new Date()
            });
        }
        logger_1.logger.info(`Order refunded: ${order.order_no} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Order refunded successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders/:id/payment - Create payment for order
router.post('/:id/payment', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.createPayment), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { provider, returnUrl, cancelUrl } = req.body;
        // Validate provider
        if (!provider || !['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'].includes(provider)) {
            throw new errors_1.ValidationError([
                { field: 'provider', message: 'Valid payment provider (stripe, paypal, alipay, wechat, alipay_merchant, or wechat_merchant) is required' }
            ]);
        }
        // Check if provider is available
        const availableProviders = (0, payment_1.getAvailableProviders)();
        if (!availableProviders.includes(provider)) {
            throw new errors_1.ValidationError([
                { field: 'provider', message: `Payment provider ${provider} is not available` }
            ]);
        }
        // Find order
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        // Check if order can be paid
        if (order.status !== 'pending') {
            throw new errors_1.ValidationError([
                { field: 'status', message: 'Only pending orders can be paid' }
            ]);
        }
        // Get user info for description
        const user = await (0, database_1.db)('users')
            .where('user_id', order.user_id)
            .first();
        const description = `FGVPN ${order.order_type} plan for ${user?.email || order.user_id}`;
        const currency = config_1.config.payment?.defaultCurrency || 'USD';
        // Create payment
        const paymentResponse = await (0, payment_1.createPayment)(provider, {
            orderId: order.id.toString(),
            orderNo: order.order_no,
            userId: order.user_id,
            amount: parseFloat(order.amount),
            currency,
            description,
            returnUrl: returnUrl || `${config_1.config.adminWebUrl}/orders/success`,
            cancelUrl: cancelUrl || `${config_1.config.adminWebUrl}/orders/cancel`,
            metadata: {
                orderType: order.order_type,
                trafficLimit: order.traffic_limit?.toString() || '',
                durationDays: order.duration_days?.toString() || '',
            }
        });
        logger_1.logger.info(`Payment created for order: ${order.order_no} using ${provider}`);
        // 发送支付通知邮件给管理员（所有支付方式）
        const adminEmail = config_1.config.smtp?.adminEmail || config_1.config.smtp?.user;
        if (adminEmail && email_1.emailService.isEmailConfigured()) {
            try {
                await email_1.emailService.sendPaymentSuccessNotification({
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
                logger_1.logger.info(`Payment notification email sent for order: ${order.order_no}`);
            }
            catch (emailError) {
                logger_1.logger.error('Failed to send payment notification email:', emailError);
                // 邮件发送失败不影响支付流程
            }
        }
        else {
            logger_1.logger.warn('Email service not configured or admin email not set. Skipping notification.');
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/orders/:id/payment-status - Get payment status
router.get('/:id/payment-status', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
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
        const paymentStatus = await (0, payment_1.getPaymentStatus)(order.payment_method, order.payment_id);
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/orders/:id/refund - Refund order (with payment provider)
router.post('/:id/payment-refund', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.OrderValidation.paymentRefund), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        const order = await (0, database_1.db)('orders')
            .where('id', id)
            .orWhere('order_no', id)
            .first();
        if (!order) {
            throw new errors_1.NotFoundError('Order', id);
        }
        // Check if order has payment information
        if (!order.payment_method || !order.payment_id) {
            throw new errors_1.ValidationError([
                { field: 'payment', message: 'Order does not have payment information' }
            ]);
        }
        // Process refund through payment provider
        const refundResult = await (0, payment_1.processRefund)(order.id.toString(), amount, reason, req.user?.username || 'system');
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/orders/payment/providers - Get available payment providers
router.get('/payment/providers', async (req, res, next) => {
    try {
        const providers = (0, payment_1.getAvailableProviders)();
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
                defaultCurrency: config_1.config.payment?.defaultCurrency || 'USD',
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/orders/payment/qrcode/:provider - Get QR code info for payment
router.get('/payment/qrcode/:provider', async (req, res, next) => {
    try {
        const { provider } = req.params;
        // Validate provider
        if (!['alipay', 'wechat'].includes(provider)) {
            throw new errors_1.ValidationError([
                { field: 'provider', message: 'Provider must be alipay or wechat' }
            ]);
        }
        // Check if provider is available
        const availableProviders = (0, payment_1.getAvailableProviders)();
        if (!availableProviders.includes(provider)) {
            throw new errors_1.ValidationError([
                { field: 'provider', message: `Payment provider ${provider} is not available` }
            ]);
        }
        // Get QR code info
        const qrCodeInfo = (0, payment_1.getQRCodeInfo)(provider);
        if (!qrCodeInfo || !qrCodeInfo.qrCodeUrl) {
            throw new errors_1.ValidationError([
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/orders/stats/overview - Get order statistics
router.get('/stats/overview', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7) + '-01';
        const [todayStats] = await (0, database_1.db)('orders')
            .where('created_at', '>=', today)
            .where('status', 'completed')
            .sum('amount as total')
            .count('* as count');
        const [monthStats] = await (0, database_1.db)('orders')
            .where('created_at', '>=', thisMonth)
            .where('status', 'completed')
            .sum('amount as total')
            .count('* as count');
        const [totalStats] = await (0, database_1.db)('orders')
            .where('status', 'completed')
            .sum('amount as total')
            .count('* as count');
        const pendingCount = await (0, database_1.db)('orders')
            .where('status', 'pending')
            .count('* as count')
            .first();
        const statusCounts = await (0, database_1.db)('orders')
            .select('status')
            .count('* as count')
            .groupBy('status');
        const recentOrders = await (0, database_1.db)('orders')
            .orderBy('created_at', 'desc')
            .limit(10)
            .select('*');
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                today: {
                    revenue: parseFloat(todayStats.total) || 0,
                    count: parseInt(todayStats.count) || 0
                },
                thisMonth: {
                    revenue: parseFloat(monthStats.total) || 0,
                    count: parseInt(monthStats.count) || 0
                },
                total: {
                    revenue: parseFloat(totalStats.total) || 0,
                    count: parseInt(totalStats.count) || 0
                },
                pendingCount: parseInt(pendingCount?.count) || 0,
                statusDistribution: statusCounts.reduce((acc, curr) => {
                    acc[curr.status] = parseInt(curr.count);
                    return acc;
                }, {}),
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
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=orders.js.map