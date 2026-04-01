"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionOrder = exports.resetVpnUuid = exports.generateSubscriptionUrl = exports.getUserSubscription = exports.getPlans = void 0;
const database_1 = __importDefault(require("@/config/database"));
const crypto_1 = require("@/utils/crypto");
const AppError_1 = require("@/errors/AppError");
const constants_1 = require("@/constants");
const service_type_1 = require("@/constants/service-type");
const nodeFilterService_1 = require("./nodeFilterService");
/**
 * Get all available subscription plans
 */
const getPlans = async () => {
    const plans = await (0, database_1.default)('subscription_plans')
        .where({ status: 1 })
        .orderBy('sort_order', 'asc')
        .select('*');
    return plans.map((plan) => {
        // 解析服务类型
        let serviceTypes = [service_type_1.ServiceType.STANDARD];
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
        // 获取服务类型详情
        const serviceTypeDetails = serviceTypes.map((type) => ({
            type,
            label: service_type_1.ServiceTypeMeta[type]?.label || type,
            color: service_type_1.ServiceTypeMeta[type]?.color || '#666666',
            icon: service_type_1.ServiceTypeMeta[type]?.icon || 'circle',
        }));
        // 获取套餐组信息
        const group = service_type_1.PLAN_GROUPS.find((g) => g.serviceTypes.every((st) => serviceTypes.includes(st)));
        return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            durationDays: plan.duration_days,
            trafficLimit: plan.traffic_limit,
            features: plan.features ? JSON.parse(plan.features) : [],
            isPopular: plan.is_popular === 1,
            sortOrder: plan.sort_order,
            status: plan.status,
            serviceTypes,
            serviceTypeDetails,
            groupId: group?.id || 'standard',
            groupName: group?.name || '标准套餐',
        };
    });
};
exports.getPlans = getPlans;
/**
 * Get user current subscription info
 */
const getUserSubscription = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // Get active subscription if exists
    const subscription = await (0, database_1.default)('user_subscriptions')
        .where({ user_id: userId })
        .where('status', constants_1.SUBSCRIPTION_STATUS.ACTIVE)
        .where('end_date', '>', new Date())
        .orderBy('created_at', 'desc')
        .first();
    // Get plan name if subscription exists
    let planName = null;
    let planServiceTypes = [service_type_1.ServiceType.STANDARD];
    if (subscription) {
        const plan = await (0, database_1.default)('subscription_plans').where({ id: subscription.plan_id }).first();
        planName = plan?.name || null;
        // 解析套餐的服务类型
        if (plan?.service_types) {
            if (typeof plan.service_types === 'string') {
                try {
                    planServiceTypes = JSON.parse(plan.service_types);
                }
                catch {
                    planServiceTypes = [plan.service_types];
                }
            }
            else if (Array.isArray(plan.service_types)) {
                planServiceTypes = plan.service_types;
            }
        }
    }
    // 获取用户有效的服务类型
    let effectiveServiceTypes = [service_type_1.ServiceType.STANDARD];
    if (user.effective_service_types) {
        if (typeof user.effective_service_types === 'string') {
            try {
                effectiveServiceTypes = JSON.parse(user.effective_service_types);
            }
            catch {
                effectiveServiceTypes = [user.effective_service_types];
            }
        }
        else if (Array.isArray(user.effective_service_types)) {
            effectiveServiceTypes = user.effective_service_types;
        }
    }
    const trafficLimit = user.traffic_limit || 0;
    const trafficUsed = user.traffic_used || 0;
    const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
    const usagePercent = trafficLimit > 0 ? Math.round((trafficUsed / trafficLimit) * 100) : 0;
    let daysRemaining = 0;
    if (user.expire_date) {
        const now = new Date();
        const expireDate = new Date(user.expire_date);
        daysRemaining = Math.max(0, Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    // 获取可访问节点统计
    const accessibleNodes = await nodeFilterService_1.nodeFilterService.getAccessibleNodeCount(userId);
    return {
        userId: user.user_id,
        status: subscription ? subscription.status : user.status,
        trafficLimit,
        trafficUsed,
        trafficRemaining,
        usagePercent,
        expireDate: user.expire_date ? new Date(user.expire_date).toISOString() : null,
        daysRemaining,
        planName,
        serviceTypes: planServiceTypes,
        effectiveServiceTypes,
        accessibleNodes,
    };
};
exports.getUserSubscription = getUserSubscription;
/**
 * Generate subscription URL for user
 */
const generateSubscriptionUrl = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // Generate subscription URL using VPN UUID
    const baseUrl = process.env.SUBSCRIPTION_BASE_URL || 'https://api.embarks.uk/sub';
    const url = `${baseUrl}/${user.vpn_uuid}`;
    // Generate QR code URL (using a QR code service or generate locally)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return {
        url,
        qrCode,
    };
};
exports.generateSubscriptionUrl = generateSubscriptionUrl;
/**
 * Reset user VPN UUID
 */
const resetVpnUuid = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // Generate new VPN UUID
    const newVpnUuid = (0, crypto_1.generateVpnUuid)();
    // Update user with new UUID
    await (0, database_1.default)('users')
        .where({ user_id: userId })
        .update({
        vpn_uuid: newVpnUuid,
        updated_at: new Date(),
    });
    return {
        vpnUuid: newVpnUuid,
    };
};
exports.resetVpnUuid = resetVpnUuid;
/**
 * Create subscription order
 */
const createSubscriptionOrder = async (userId, data) => {
    const { planId, paymentMethod } = data;
    // Validate plan
    const plan = await (0, database_1.default)('subscription_plans').where({ id: planId }).first();
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
    // Create order
    const orderId = (0, crypto_1.generateOrderId)();
    const orderNo = (0, crypto_1.generateOrderNo)();
    // 解析套餐的服务类型
    let serviceTypes = [service_type_1.ServiceType.STANDARD];
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
    const [order] = await (0, database_1.default)('orders')
        .insert({
        id: orderId,
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
    })
        .returning('*');
    // Generate payment URL if payment method provided
    let paymentUrl;
    if (paymentMethod) {
        // In production, integrate with actual payment gateway
        // For now, return a mock payment URL
        paymentUrl = `${process.env.PAYMENT_BASE_URL || 'https://pay.embarks.uk'}/pay/${orderNo}`;
    }
    return {
        order: formatOrder(order),
        paymentUrl,
    };
};
exports.createSubscriptionOrder = createSubscriptionOrder;
/**
 * Format database order to Order type
 */
const formatOrder = (order) => {
    return {
        id: order.id,
        orderNo: order.order_no,
        userId: order.user_id,
        planId: order.plan_id,
        orderType: order.order_type,
        status: order.status,
        amount: order.amount,
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
//# sourceMappingURL=subscriptionService.js.map