"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFlowManager = exports.PaymentFlowManager = void 0;
exports.initializePaymentFlowManager = initializePaymentFlowManager;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
const index_1 = require("./index");
const types_1 = require("./types");
// 支付流程管理器
class PaymentFlowManager {
    static instance;
    retryConfig;
    inProgressPayments = new Set();
    constructor() {
        this.retryConfig = {
            maxAttempts: 5,
            delayMs: 1000,
            maxDelayMs: 30000,
            backoffMultiplier: 2
        };
    }
    static getInstance() {
        if (!PaymentFlowManager.instance) {
            PaymentFlowManager.instance = new PaymentFlowManager();
        }
        return PaymentFlowManager.instance;
    }
    /**
     * 生成幂等性键
     */
    generateIdempotencyKey(orderId, provider) {
        return `${provider}_${orderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 创建支付流程
     */
    async createPaymentFlow(provider, request) {
        // 验证输入
        (0, types_1.validateString)(request.orderId, 'orderId');
        (0, types_1.validateString)(request.orderNo, 'orderNo');
        (0, types_1.validateString)(request.userId, 'userId');
        (0, types_1.validateAmount)(request.amount, 'amount');
        (0, types_1.validateCurrency)(request.currency);
        // 生成幂等性键
        const idempotencyKey = this.generateIdempotencyKey(request.orderId, provider);
        // 检查是否已存在相同的支付流程
        const existingFlow = await this.getPaymentFlowByOrderId(request.orderId);
        if (existingFlow) {
            // 如果已存在，返回现有的支付信息
            return {
                success: true,
                provider: existingFlow.provider,
                orderId: existingFlow.orderId,
                clientSecret: existingFlow.metadata?.clientSecret,
                checkoutUrl: existingFlow.metadata?.checkoutUrl,
                paymentIntentId: existingFlow.providerOrderId
            };
        }
        // 创建支付流程记录
        const flowId = await this.createPaymentFlowRecord({
            orderId: request.orderId,
            orderNo: request.orderNo,
            userId: request.userId,
            amount: request.amount,
            currency: request.currency,
            provider,
            status: 'pending',
            attempts: 0,
            idempotencyKey,
            metadata: request.metadata
        });
        // 执行支付创建
        return this.executePaymentCreation(flowId, provider, request);
    }
    /**
     * 执行支付创建
     */
    async executePaymentCreation(flowId, provider, request) {
        try {
            // 标记为处理中
            this.inProgressPayments.add(flowId);
            // 更新状态为处理中
            await this.updatePaymentFlowStatus(flowId, 'processing');
            // 增加尝试次数
            await this.incrementAttempts(flowId);
            // 获取支付提供商
            const paymentProvider = (0, index_1.getPaymentProvider)(provider);
            // 创建支付
            const response = await paymentProvider.createPayment(request);
            // 更新支付流程记录
            await this.updatePaymentFlowRecord(flowId, {
                status: 'pending',
                providerOrderId: response.paymentIntentId,
                metadata: {
                    ...request.metadata,
                    clientSecret: response.clientSecret || '',
                    checkoutUrl: response.checkoutUrl || ''
                }
            });
            return response;
        }
        catch (error) {
            // 处理错误
            await this.handlePaymentFailure(flowId, error);
            throw error;
        }
        finally {
            // 移除处理中标记
            this.inProgressPayments.delete(flowId);
        }
    }
    /**
     * 处理支付失败
     */
    async handlePaymentFailure(flowId, error) {
        const flow = await this.getPaymentFlowById(flowId);
        if (!flow)
            return;
        // 计算下一次尝试时间
        const nextAttemptAt = this.calculateNextAttemptTime(flow.attempts);
        // 更新失败信息
        await this.updatePaymentFlowRecord(flowId, {
            status: 'failed',
            nextAttemptAt,
            metadata: {
                ...flow.metadata,
                lastError: JSON.stringify({
                    code: error instanceof types_1.PaymentError ? error.code : 'UNKNOWN_ERROR',
                    message: error.message,
                    timestamp: new Date().toISOString()
                })
            }
        });
        // 如果还有尝试次数，安排重试
        if (flow.attempts < this.retryConfig.maxAttempts) {
            setTimeout(() => {
                this.retryPayment(flowId).catch(err => {
                    logger_1.logger.error(`Failed to retry payment ${flowId}:`, err);
                });
            }, this.calculateDelayMs(flow.attempts));
        }
    }
    /**
     * 重试支付
     */
    async retryPayment(flowId) {
        const flow = await this.getPaymentFlowById(flowId);
        if (!flow)
            return;
        // 检查是否超过最大尝试次数
        if (flow.attempts >= this.retryConfig.maxAttempts) {
            logger_1.logger.warn(`Payment ${flowId} has reached maximum retry attempts`);
            return;
        }
        // 检查是否正在处理中
        if (this.inProgressPayments.has(flowId)) {
            logger_1.logger.warn(`Payment ${flowId} is already in progress`);
            return;
        }
        try {
            // 重新执行支付创建
            const request = {
                orderId: flow.orderId,
                orderNo: flow.orderNo,
                userId: flow.userId,
                amount: flow.amount,
                currency: flow.currency,
                description: flow.metadata?.description || `Payment for order ${flow.orderNo}`,
                returnUrl: flow.metadata?.returnUrl,
                cancelUrl: flow.metadata?.cancelUrl,
                metadata: flow.metadata
            };
            await this.executePaymentCreation(flowId, flow.provider, request);
        }
        catch (error) {
            logger_1.logger.error(`Retry failed for payment ${flowId}:`, error);
        }
    }
    /**
     * 计算下一次尝试时间
     */
    calculateNextAttemptTime(attempts) {
        const delayMs = this.calculateDelayMs(attempts);
        return new Date(Date.now() + delayMs);
    }
    /**
     * 计算延迟时间
     */
    calculateDelayMs(attempts) {
        const delay = this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffMultiplier, attempts);
        return Math.min(delay, this.retryConfig.maxDelayMs);
    }
    /**
     * 查询支付状态
     */
    async getPaymentStatus(provider, paymentId) {
        const paymentProvider = (0, index_1.getPaymentProvider)(provider);
        return paymentProvider.getPaymentStatus(paymentId);
    }
    /**
     * 处理退款
     */
    async processRefund(orderId, amount, reason, changedBy = 'system') {
        // 验证输入
        (0, types_1.validateString)(orderId, 'orderId');
        if (amount !== undefined) {
            (0, types_1.validateAmount)(amount, 'amount');
        }
        // 获取订单信息
        const order = await (0, database_1.db)('orders').where('id', orderId).first();
        if (!order) {
            throw new types_1.PaymentError('Order not found', 'ORDER_NOT_FOUND');
        }
        // 检查是否可以退款
        if (!(0, types_1.canTransitionOrderStatus)(order.status, 'refunded')) {
            throw new types_1.PaymentError(`Order cannot be refunded. Current status: ${order.status}`, 'INVALID_STATUS');
        }
        // 获取支付提供商
        const provider = order.payment_provider;
        const paymentProvider = (0, index_1.getPaymentProvider)(provider);
        // 创建退款请求
        const refundRequest = {
            paymentId: order.payment_id || '',
            amount: amount || order.amount,
            reason: reason || 'Refund requested'
        };
        // 执行退款
        const refundResponse = await paymentProvider.processRefund(refundRequest);
        // 更新订单状态
        const now = new Date();
        await (0, database_1.db)('orders')
            .where('id', orderId)
            .update({
            status: 'refunded',
            updated_at: now
        });
        // 记录状态变更
        await (0, database_1.db)('order_status_logs').insert({
            order_id: orderId,
            from_status: order.status,
            to_status: 'refunded',
            changed_by: changedBy,
            reason: `Refund processed: ${refundResponse.refundId}`
        });
        // 处理流量限制退款
        if (order.traffic_limit) {
            await (0, database_1.db)('users')
                .where('user_id', order.user_id)
                .update({
                traffic_limit: database_1.db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
                updated_at: now
            });
        }
        return refundResponse;
    }
    /**
     * 处理支付成功
     */
    async processPaymentSuccess(provider, orderId, providerOrderId, amount, currency) {
        // 获取订单
        const order = await (0, database_1.db)('orders').where('id', orderId).first();
        if (!order) {
            throw new types_1.PaymentError('Order not found', 'ORDER_NOT_FOUND');
        }
        // 检查状态转换
        if (!(0, types_1.canTransitionOrderStatus)(order.status, 'paid')) {
            throw new types_1.PaymentError(`Order cannot be marked as paid. Current status: ${order.status}`, 'INVALID_STATUS');
        }
        // 更新订单状态
        const now = new Date();
        await (0, database_1.db)('orders')
            .where('id', orderId)
            .update({
            status: 'paid',
            payment_id: providerOrderId,
            payment_provider: provider,
            updated_at: now
        });
        // 记录状态变更
        await (0, database_1.db)('order_status_logs').insert({
            order_id: orderId,
            from_status: order.status,
            to_status: 'paid',
            changed_by: 'system',
            reason: 'Payment completed successfully'
        });
        // 更新支付流程状态
        const flow = await this.getPaymentFlowByOrderId(orderId);
        if (flow) {
            await this.updatePaymentFlowStatus(flow.id, 'paid');
        }
    }
    /**
     * 处理支付失败
     */
    async processPaymentFailure(provider, orderId, reason) {
        // 获取订单
        const order = await (0, database_1.db)('orders').where('id', orderId).first();
        if (!order) {
            throw new types_1.PaymentError('Order not found', 'ORDER_NOT_FOUND');
        }
        // 检查状态转换
        if (!(0, types_1.canTransitionOrderStatus)(order.status, 'cancelled')) {
            throw new types_1.PaymentError(`Order cannot be marked as cancelled. Current status: ${order.status}`, 'INVALID_STATUS');
        }
        // 更新订单状态
        const now = new Date();
        await (0, database_1.db)('orders')
            .where('id', orderId)
            .update({
            status: 'cancelled',
            updated_at: now
        });
        // 记录状态变更
        await (0, database_1.db)('order_status_logs').insert({
            order_id: orderId,
            from_status: order.status,
            to_status: 'cancelled',
            changed_by: 'system',
            reason: `Payment failed: ${reason || 'Unknown error'}`
        });
        // 更新支付流程状态
        const flow = await this.getPaymentFlowByOrderId(orderId);
        if (flow) {
            await this.updatePaymentFlowStatus(flow.id, 'failed');
        }
    }
    // 数据库操作方法
    /**
     * 创建支付流程记录
     */
    async createPaymentFlowRecord(data) {
        const now = new Date();
        const [id] = await (0, database_1.db)('payment_flows').insert({
            ...data,
            createdAt: now,
            updatedAt: now
        });
        return id.toString();
    }
    /**
     * 更新支付流程记录
     */
    async updatePaymentFlowRecord(id, data) {
        await (0, database_1.db)('payment_flows')
            .where('id', id)
            .update({
            ...data,
            updatedAt: new Date()
        });
    }
    /**
     * 更新支付流程状态
     */
    async updatePaymentFlowStatus(id, status) {
        await this.updatePaymentFlowRecord(id, { status });
    }
    /**
     * 增加尝试次数
     */
    async incrementAttempts(id) {
        await (0, database_1.db)('payment_flows')
            .where('id', id)
            .update({
            attempts: database_1.db.raw('attempts + 1'),
            lastAttemptAt: new Date(),
            updatedAt: new Date()
        });
    }
    /**
     * 根据ID获取支付流程
     */
    async getPaymentFlowById(id) {
        return (0, database_1.db)('payment_flows').where('id', id).first();
    }
    /**
     * 根据订单ID获取支付流程
     */
    async getPaymentFlowByOrderId(orderId) {
        return (0, database_1.db)('payment_flows').where('orderId', orderId).first();
    }
    /**
     * 获取待处理的支付流程
     */
    async getPendingPaymentFlows() {
        return (0, database_1.db)('payment_flows')
            .where('status', 'in', ['pending', 'processing'])
            .where('nextAttemptAt', '<=', new Date())
            .where('attempts', '<', this.retryConfig.maxAttempts)
            .orderBy('createdAt', 'asc');
    }
    /**
     * 清理过期的支付流程
     */
    async cleanupExpiredFlows() {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天前
        await (0, database_1.db)('payment_flows')
            .where('createdAt', '<', cutoffDate)
            .where('status', 'in', ['failed', 'cancelled', 'refunded'])
            .del();
    }
}
exports.PaymentFlowManager = PaymentFlowManager;
/**
 * 初始化支付流程管理器
 */
function initializePaymentFlowManager() {
    exports.paymentFlowManager = PaymentFlowManager.getInstance();
}
//# sourceMappingURL=payment-flow-manager.js.map