"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentAggregator = exports.PaymentAggregator = void 0;
exports.initializePaymentAggregator = initializePaymentAggregator;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
const pci_dss_1 = require("../../utils/pci-dss");
const payment_logger_1 = require("../../utils/payment-logger");
const types_1 = require("./types");
const index_1 = require("./index");
/**
 * 支付聚合器核心类
 * 提供统一的支付处理能力，管理多个支付渠道
 */
class PaymentAggregator {
    static instance;
    providers = new Map();
    constructor() {
        this.initializeProviders();
    }
    /**
     * 获取支付聚合器实例（单例模式）
     */
    static getInstance() {
        if (!PaymentAggregator.instance) {
            PaymentAggregator.instance = new PaymentAggregator();
        }
        return PaymentAggregator.instance;
    }
    /**
     * 初始化支付提供商
     */
    initializeProviders() {
        try {
            const availableProviders = (0, index_1.getAvailableProviders)();
            availableProviders.forEach(provider => {
                try {
                    const paymentProvider = (0, index_1.getPaymentProvider)(provider);
                    this.providers.set(provider, paymentProvider);
                    logger_1.logger.info(`Payment aggregator initialized provider: ${provider}`);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to initialize provider ${provider}:`, error);
                }
            });
            if (this.providers.size === 0) {
                logger_1.logger.warn('No payment providers available in aggregator');
            }
            else {
                logger_1.logger.info(`Payment aggregator initialized with providers: ${Array.from(this.providers.keys()).join(', ')}`);
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize providers:', error);
        }
    }
    /**
     * 获取所有可用的支付提供商
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
    /**
     * 根据订单金额和货币选择最合适的支付提供商
     */
    selectProvider(amount, currency) {
        const availableProviders = this.getAvailableProviders();
        if (availableProviders.length === 0) {
            throw new types_1.PaymentError('No payment providers available', 'NO_PROVIDERS_AVAILABLE');
        }
        // 这里可以实现更复杂的提供商选择逻辑
        // 例如：根据金额、货币、用户偏好等因素
        return availableProviders[0];
    }
    /**
     * 创建支付
     */
    async createPayment(provider, request) {
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        // 验证请求数据
        this.validateCreatePaymentRequest(request);
        // PCI DSS合规检查
        const compliance = pci_dss_1.PCIDSSUtil.checkCompliance(request);
        if (!compliance.compliant) {
            logger_1.logger.warn('PCI DSS compliance issues:', compliance.issues);
        }
        // 记录支付请求（不包含敏感信息）
        const sanitizedRequest = pci_dss_1.PCIDSSUtil.sanitizeData(request);
        logger_1.logger.debug('Payment request:', sanitizedRequest);
        try {
            // 更新订单支付方式
            await (0, database_1.db)('orders')
                .where('id', request.orderId)
                .update({
                payment_method: provider,
                updated_at: new Date(),
            });
            // 创建支付
            const response = await paymentProvider.createPayment(request);
            // 存储支付意图ID
            if (response.paymentIntentId) {
                await (0, database_1.db)('orders')
                    .where('id', request.orderId)
                    .update({
                    payment_id: response.paymentIntentId,
                    updated_at: new Date(),
                });
            }
            // 记录支付创建成功日志
            payment_logger_1.PaymentLogger.logPaymentCreate(provider, request.orderNo, request.amount, request.currency, request.userId, request.metadata);
            logger_1.logger.info(`Payment created successfully via ${provider} for order: ${request.orderNo}`);
            return response;
        }
        catch (error) {
            // 记录支付错误日志
            if (error instanceof Error) {
                payment_logger_1.PaymentLogger.logPaymentError(provider, request.orderNo, error, { amount: request.amount, currency: request.currency, userId: request.userId });
            }
            logger_1.logger.error(`Failed to create payment via ${provider}:`, error);
            throw new types_1.PaymentError(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PAYMENT_CREATION_FAILED', provider);
        }
    }
    /**
     * 处理支付成功
     */
    async processPaymentSuccess(provider, event) {
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        try {
            const paymentData = await paymentProvider.handlePaymentSuccess(event);
            // 查找订单
            const orderId = paymentData.metadata?.orderId;
            if (!orderId) {
                throw new types_1.PaymentError('Order ID not found in payment metadata', 'MISSING_ORDER_ID');
            }
            const order = await (0, database_1.db)('orders').where('id', orderId).first();
            if (!order) {
                throw new types_1.PaymentError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND');
            }
            // 检查订单状态转换
            if (!(0, types_1.canTransitionOrderStatus)(order.status, 'paid')) {
                logger_1.logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to paid`);
                return;
            }
            const now = new Date();
            const startDate = now;
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + (order.duration_days || 30));
            // 更新订单状态
            await (0, database_1.db)('orders')
                .where('id', order.id)
                .update({
                status: 'paid',
                payment_time: now,
                start_date: startDate,
                end_date: endDate,
                updated_at: now,
            });
            // 记录状态变更
            await (0, database_1.db)('order_status_logs').insert({
                order_id: order.id,
                from_status: order.status,
                to_status: 'paid',
                changed_by: 'system',
                reason: `Payment received via ${provider}`,
            });
            // 更新用户流量限制和过期日期
            if (order.traffic_limit) {
                await (0, database_1.db)('users')
                    .where('user_id', order.user_id)
                    .update({
                    traffic_limit: database_1.db.raw('traffic_limit + ?', [order.traffic_limit]),
                    expire_date: endDate,
                    updated_at: now,
                });
            }
            // 记录支付成功日志
            payment_logger_1.PaymentLogger.logPaymentSuccess(provider, order.order_no, paymentData.providerOrderId, paymentData.amount, paymentData.currency, order.user_id);
            logger_1.logger.info(`Payment success processed for order: ${order.order_no} via ${provider}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to process payment success via ${provider}:`, error);
            throw new types_1.PaymentError(`Failed to process payment success: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PAYMENT_SUCCESS_PROCESSING_FAILED', provider);
        }
    }
    /**
     * 处理支付失败
     */
    async processPaymentFailure(provider, event) {
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        try {
            const failureData = await paymentProvider.handlePaymentFailure(event);
            // 查找订单
            const order = await (0, database_1.db)('orders')
                .where('payment_id', failureData.providerOrderId)
                .first();
            if (!order) {
                // 记录支付失败日志
                payment_logger_1.PaymentLogger.logPaymentFailure(provider, '', failureData.reason || 'Payment failed', '');
                logger_1.logger.warn(`Order not found for failed payment: ${failureData.providerOrderId}`);
                return;
            }
            // 记录支付失败日志
            payment_logger_1.PaymentLogger.logPaymentFailure(provider, order.order_no, failureData.reason || 'Payment failed', order.user_id);
            // 检查订单状态转换
            if (!(0, types_1.canTransitionOrderStatus)(order.status, 'cancelled')) {
                logger_1.logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to cancelled`);
                return;
            }
            // 更新订单状态
            await (0, database_1.db)('orders')
                .where('id', order.id)
                .update({
                status: 'cancelled',
                updated_at: new Date(),
            });
            // 记录状态变更
            await (0, database_1.db)('order_status_logs').insert({
                order_id: order.id,
                from_status: order.status,
                to_status: 'cancelled',
                changed_by: 'system',
                reason: `Payment failed: ${failureData.reason || 'Unknown reason'}`,
            });
            logger_1.logger.info(`Payment failure processed for order: ${order.order_no} via ${provider}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to process payment failure via ${provider}:`, error);
            throw new types_1.PaymentError(`Failed to process payment failure: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PAYMENT_FAILURE_PROCESSING_FAILED', provider);
        }
    }
    /**
     * 处理退款
     */
    async processRefund(orderId, amount, reason, changedBy = 'system') {
        // 查找订单
        const order = await (0, database_1.db)('orders').where('id', orderId).first();
        if (!order) {
            throw new types_1.PaymentError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND');
        }
        // 检查订单状态
        if (order.status !== 'paid' && order.status !== 'completed') {
            throw new types_1.PaymentError(`Order cannot be refunded. Current status: ${order.status}`, 'INVALID_ORDER_STATUS');
        }
        if (!order.payment_method || !order.payment_id) {
            throw new types_1.PaymentError('Order does not have payment information', 'MISSING_PAYMENT_INFO');
        }
        const provider = order.payment_method;
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        try {
            // 处理退款
            const refundRequest = {
                paymentId: order.payment_id,
                amount,
                reason,
            };
            const refundResult = await paymentProvider.processRefund(refundRequest);
            if (refundResult.success) {
                const now = new Date();
                // 更新订单状态
                await (0, database_1.db)('orders')
                    .where('id', order.id)
                    .update({
                    status: 'refunded',
                    updated_at: now,
                });
                // 记录状态变更
                await (0, database_1.db)('order_status_logs').insert({
                    order_id: order.id,
                    from_status: order.status,
                    to_status: 'refunded',
                    changed_by: changedBy,
                    reason: reason || 'Order refunded',
                });
                // 扣除用户流量限制
                if (order.traffic_limit) {
                    await (0, database_1.db)('users')
                        .where('user_id', order.user_id)
                        .update({
                        traffic_limit: database_1.db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
                        updated_at: now,
                    });
                }
                logger_1.logger.info(`Refund processed for order: ${order.order_no} by ${changedBy} via ${provider}`);
            }
            return refundResult;
        }
        catch (error) {
            logger_1.logger.error(`Failed to process refund via ${provider}:`, error);
            throw new types_1.PaymentError(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`, 'REFUND_PROCESSING_FAILED', provider);
        }
    }
    /**
     * 获取支付状态
     */
    async getPaymentStatus(provider, paymentId) {
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        try {
            const status = await paymentProvider.getPaymentStatus(paymentId);
            logger_1.logger.info(`Retrieved payment status for ${paymentId} via ${provider}: ${status.status}`);
            return status;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get payment status via ${provider}:`, error);
            throw new types_1.PaymentError(`Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PAYMENT_STATUS_RETRIEVAL_FAILED', provider);
        }
    }
    /**
     * 验证支付请求
     */
    validateCreatePaymentRequest(request) {
        if (!request.orderId) {
            throw new types_1.PaymentError('Order ID is required', 'MISSING_ORDER_ID');
        }
        if (!request.amount || request.amount <= 0) {
            throw new types_1.PaymentError('Amount must be greater than 0', 'INVALID_AMOUNT');
        }
        if (!request.currency) {
            throw new types_1.PaymentError('Currency is required', 'MISSING_CURRENCY');
        }
        if (!request.description) {
            throw new types_1.PaymentError('Description is required', 'MISSING_DESCRIPTION');
        }
    }
    /**
     * 检查是否为二维码支付
     */
    isQRCodePayment(provider) {
        return (0, index_1.isQRCodePayment)(provider);
    }
    /**
     * 获取二维码信息
     */
    getQRCodeInfo(provider) {
        return (0, index_1.getQRCodeInfo)(provider);
    }
    /**
     * 验证 webhook 签名
     */
    verifyWebhookSignature(provider, payload, signature) {
        if (!this.providers.has(provider)) {
            logger_1.logger.warn(`Provider ${provider} is not available for signature verification`);
            return false;
        }
        try {
            const paymentProvider = this.providers.get(provider);
            const secret = this.getWebhookSecret(provider);
            return paymentProvider.verifyWebhookSignature(payload, signature, secret);
        }
        catch (error) {
            logger_1.logger.error(`Webhook signature verification failed for ${provider}:`, error);
            return false;
        }
    }
    /**
     * 解析 webhook 事件
     */
    parseWebhookEvent(provider, rawBody, signature) {
        if (!this.providers.has(provider)) {
            throw new types_1.PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
        }
        const paymentProvider = this.providers.get(provider);
        return paymentProvider.parseWebhookEvent(rawBody, signature);
    }
    /**
     * 获取 webhook 密钥
     */
    getWebhookSecret(provider) {
        const { config: appConfig } = require('../../config');
        switch (provider) {
            case 'stripe':
                return appConfig.payment?.stripe?.webhookSecret || '';
            case 'paypal':
                return appConfig.payment?.paypal?.webhookSecret || '';
            case 'alipay_merchant':
                return appConfig.payment?.alipayMerchant?.alipayPublicKey || '';
            case 'wechat_merchant':
                return appConfig.payment?.wechatMerchant?.apiKey || '';
            default:
                return '';
        }
    }
}
exports.PaymentAggregator = PaymentAggregator;
/**
 * 初始化支付聚合器
 */
function initializePaymentAggregator() {
    exports.paymentAggregator = PaymentAggregator.getInstance();
}
//# sourceMappingURL=aggregator.js.map