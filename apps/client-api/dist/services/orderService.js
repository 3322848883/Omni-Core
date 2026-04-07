"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.getPaymentInfo = exports.cancelOrder = exports.createOrder = exports.getOrderById = exports.getOrders = void 0;
const database_1 = __importDefault(require("@/config/database"));
const crypto_1 = require("@/utils/crypto");
const AppError_1 = require("@/errors/AppError");
const constants_1 = require("@/constants");
const service_type_1 = require("@/constants/service-type");
/**
 * 验证分页参数
 * @param page - 页码
 * @param limit - 每页数量
 */
const validatePaginationParams = (page, limit) => {
    if (page < 1) {
        throw new AppError_1.ValidationError([{ field: 'page', message: 'Page must be greater than or equal to 1' }]);
    }
    if (limit < 1 || limit > 100) {
        throw new AppError_1.ValidationError([{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }
};
/**
 * Format database order to Order type
 */
const formatOrder = (order) => {
    return {
        id: order.order_id,
        orderNo: order.order_no,
        userId: order.user_id,
        planId: order.plan_id,
        orderType: order.order_type,
        status: order.status,
        amount: parseFloat(order.amount),
        trafficLimit: order.traffic_limit,
        durationDays: order.duration_days,
        startDate: order.start_date ? new Date(order.start_date) : null,
        endDate: order.end_date ? new Date(order.end_date) : null,
        paymentMethod: order.payment_method,
        paymentTime: order.payment_time ? new Date(order.payment_time) : null,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
    };
};
/**
 * Get orders list for user with pagination and optional status filter
 */
const getOrders = async (userId, page, limit, status) => {
    // 验证分页参数
    validatePaginationParams(page, limit);
    const query = (0, database_1.default)('orders').where({ user_id: userId });
    if (status) {
        query.where({ status });
    }
    // Get total count
    const countResult = await query.clone().count('* as count').first();
    const total = parseInt(countResult?.count, 10) || 0;
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
exports.getOrders = getOrders;
/**
 * Get order by ID
 */
const getOrderById = async (orderId, userId) => {
    const order = await (0, database_1.default)('orders')
        .where({ order_id: orderId, user_id: userId })
        .first();
    if (!order) {
        throw new AppError_1.NotFoundError('Order', orderId);
    }
    return formatOrder(order);
};
exports.getOrderById = getOrderById;
/**
 * Create a new order
 */
const createOrder = async (userId, planId, paymentMethod) => {
    // Validate plan
    const plan = await (0, database_1.default)('subscription_plans')
        .where({ plan_id: planId })
        .first();
    if (!plan) {
        throw new AppError_1.NotFoundError('Subscription plan', planId);
    }
    if (plan.status !== 1) {
        throw new AppError_1.ValidationError([{ field: 'planId', message: 'This plan is not available' }]);
    }
    // Check if user has pending order for same plan
    const existingPendingOrder = await (0, database_1.default)('orders')
        .where({
        user_id: userId,
        plan_id: planId,
        status: constants_1.ORDER_STATUS.PENDING,
    })
        .first();
    if (existingPendingOrder) {
        throw new AppError_1.ConflictError('You already have a pending order for this plan');
    }
    // Calculate order dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);
    // 解析套餐的服务类型
    let serviceTypes = [service_type_1.ServiceType.VPN_BASIC];
    if (plan.service_types) {
        if (typeof plan.service_types === 'string') {
            try {
                serviceTypes = JSON.parse(plan.service_types);
            }
            catch {
                serviceTypes = [plan.service_types];
            }
        }
        else if (Array.isArray(plan.service_types)) {
            serviceTypes = plan.service_types;
        }
    }
    // Create order
    const orderId = (0, crypto_1.generateOrderId)();
    const orderNo = (0, crypto_1.generateOrderNo)();
    await (0, database_1.default)('orders').insert({
        order_id: orderId,
        order_no: orderNo,
        user_id: userId,
        plan_id: planId,
        order_type: 'subscription',
        status: constants_1.ORDER_STATUS.PENDING,
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
    const order = await (0, database_1.default)('orders').where({ order_id: orderId }).first();
    return formatOrder(order);
};
exports.createOrder = createOrder;
/**
 * Cancel an order
 */
const cancelOrder = async (orderId, userId) => {
    const order = await (0, database_1.default)('orders')
        .where({ order_id: orderId, user_id: userId })
        .first();
    if (!order) {
        throw new AppError_1.NotFoundError('Order', orderId);
    }
    // Only pending orders can be cancelled
    if (order.status !== constants_1.ORDER_STATUS.PENDING) {
        throw new AppError_1.ValidationError([
            { field: 'status', message: `Cannot cancel order with status: ${order.status}` },
        ]);
    }
    await (0, database_1.default)('orders')
        .where({ order_id: orderId })
        .update({
        status: constants_1.ORDER_STATUS.CANCELLED,
        updated_at: new Date(),
    });
    const updatedOrder = await (0, database_1.default)('orders').where({ order_id: orderId }).first();
    return formatOrder(updatedOrder);
};
exports.cancelOrder = cancelOrder;
/**
 * Get payment information for an order
 */
const getPaymentInfo = async (orderId, userId) => {
    const order = await (0, database_1.default)('orders')
        .where({ order_id: orderId, user_id: userId })
        .first();
    if (!order) {
        throw new AppError_1.NotFoundError('Order', orderId);
    }
    // Check if order can be paid
    if (order.status !== constants_1.ORDER_STATUS.PENDING) {
        throw new AppError_1.ValidationError([
            { field: 'status', message: `Order is not in pending status: ${order.status}` },
        ]);
    }
    const paymentMethod = order.payment_method || 'stripe';
    // Generate payment URL based on payment method
    let paymentUrl;
    let qrCode;
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
exports.getPaymentInfo = getPaymentInfo;
/**
 * Verify payment status for an order
 */
const verifyPayment = async (orderId, userId) => {
    const order = await (0, database_1.default)('orders')
        .where({ order_id: orderId, user_id: userId })
        .first();
    if (!order) {
        throw new AppError_1.NotFoundError('Order', orderId);
    }
    // In production, this would check with the actual payment gateway
    // For now, we simulate the verification
    let paymentStatus;
    if (order.status === constants_1.ORDER_STATUS.COMPLETED) {
        paymentStatus = constants_1.PAYMENT_STATUS.SUCCESS;
    }
    else if (order.status === constants_1.ORDER_STATUS.CANCELLED) {
        paymentStatus = constants_1.PAYMENT_STATUS.FAILED;
    }
    else {
        // Check if there's a payment record
        const payment = await (0, database_1.default)('payments')
            .where({ order_id: orderId })
            .orderBy('created_at', 'desc')
            .first();
        if (payment) {
            paymentStatus = payment.status;
            // If payment is successful but order is still pending, update order
            if (paymentStatus === constants_1.PAYMENT_STATUS.SUCCESS && order.status === constants_1.ORDER_STATUS.PENDING) {
                await (0, database_1.default)('orders')
                    .where({ order_id: orderId })
                    .update({
                    status: constants_1.ORDER_STATUS.COMPLETED,
                    payment_time: new Date(),
                    updated_at: new Date(),
                });
                // Update user's subscription
                await updateUserSubscription(userId, order);
            }
        }
        else {
            paymentStatus = constants_1.PAYMENT_STATUS.PENDING;
        }
    }
    const updatedOrder = await (0, database_1.default)('orders').where({ order_id: orderId }).first();
    return {
        order: formatOrder(updatedOrder),
        paymentStatus,
    };
};
exports.verifyPayment = verifyPayment;
/**
 * Update user subscription after successful payment
 */
const updateUserSubscription = async (userId, order) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + order.duration_days);
    // 解析订单中的服务类型
    let serviceTypes = [service_type_1.ServiceType.VPN_BASIC];
    if (order.service_types) {
        if (typeof order.service_types === 'string') {
            try {
                serviceTypes = JSON.parse(order.service_types);
            }
            catch {
                serviceTypes = [order.service_types];
            }
        }
        else if (Array.isArray(order.service_types)) {
            serviceTypes = order.service_types;
        }
    }
    // Check if user has existing subscription
    const existingSubscription = await (0, database_1.default)('user_subscriptions')
        .where({ user_id: userId, status: 'active' })
        .first();
    if (existingSubscription) {
        // 获取现有订阅的服务类型
        let existingServiceTypes = [service_type_1.ServiceType.VPN_BASIC];
        if (existingSubscription.service_types) {
            if (typeof existingSubscription.service_types === 'string') {
                try {
                    existingServiceTypes = JSON.parse(existingSubscription.service_types);
                }
                catch {
                    existingServiceTypes = [existingSubscription.service_types];
                }
            }
            else if (Array.isArray(existingSubscription.service_types)) {
                existingServiceTypes = existingSubscription.service_types;
            }
        }
        // 合并服务类型（取并集）
        const mergedServiceTypes = [...new Set([...existingServiceTypes, ...serviceTypes])];
        // Extend existing subscription
        const currentEndDate = new Date(existingSubscription.end_date);
        const newEndDate = currentEndDate > now ? currentEndDate : now;
        newEndDate.setDate(newEndDate.getDate() + order.duration_days);
        await (0, database_1.default)('user_subscriptions')
            .where({ id: existingSubscription.id })
            .update({
            end_date: newEndDate,
            traffic_limit: (existingSubscription.traffic_limit || 0) + order.traffic_limit,
            service_types: JSON.stringify(mergedServiceTypes),
            updated_at: now,
        });
    }
    else {
        // Create new subscription
        await (0, database_1.default)('user_subscriptions').insert({
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
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    const currentExpireDate = user?.expire_date ? new Date(user.expire_date) : null;
    const newExpireDate = currentExpireDate && currentExpireDate > now
        ? new Date(currentExpireDate.getTime() + order.duration_days * 24 * 60 * 60 * 1000)
        : endDate;
    // 更新用户有效的服务类型（取现有和新的并集）
    let currentEffectiveTypes = [service_type_1.ServiceType.VPN_BASIC];
    if (user?.effective_service_types) {
        if (typeof user.effective_service_types === 'string') {
            try {
                currentEffectiveTypes = JSON.parse(user.effective_service_types);
            }
            catch {
                currentEffectiveTypes = [user.effective_service_types];
            }
        }
        else if (Array.isArray(user.effective_service_types)) {
            currentEffectiveTypes = user.effective_service_types;
        }
    }
    const mergedEffectiveTypes = [...new Set([...currentEffectiveTypes, ...serviceTypes])];
    await (0, database_1.default)('users')
        .where({ user_id: userId })
        .update({
        traffic_limit: (user?.traffic_limit || 0) + order.traffic_limit,
        expire_date: newExpireDate,
        effective_service_types: JSON.stringify(mergedEffectiveTypes),
        updated_at: now,
    });
};
//# sourceMappingURL=orderService.js.map