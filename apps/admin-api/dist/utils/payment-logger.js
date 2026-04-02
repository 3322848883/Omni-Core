"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLogger = void 0;
const logger_1 = require("./logger");
const pci_dss_1 = require("./pci-dss");
const encryption_1 = require("./encryption");
/**
 * 支付操作日志工具类
 * 用于记录详细的支付操作日志，确保安全审计和监控
 */
class PaymentLogger {
    /**
     * 记录支付创建日志
     * @param provider 支付提供商
     * @param orderNo 订单号
     * @param amount 金额
     * @param currency 货币
     * @param userId 用户ID
     * @param metadata 元数据
     */
    static logPaymentCreate(provider, orderNo, amount, currency, userId, metadata) {
        const sanitizedMetadata = pci_dss_1.PCIDSSUtil.sanitizeData(metadata);
        logger_1.logger.info('Payment created', {
            action: 'payment.create',
            provider,
            orderNo,
            amount,
            currency,
            userId: encryption_1.EncryptionUtil.mask(userId),
            metadata: sanitizedMetadata,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付成功日志
     * @param provider 支付提供商
     * @param orderNo 订单号
     * @param transactionId 交易ID
     * @param amount 金额
     * @param currency 货币
     * @param userId 用户ID
     */
    static logPaymentSuccess(provider, orderNo, transactionId, amount, currency, userId) {
        logger_1.logger.info('Payment success', {
            action: 'payment.success',
            provider,
            orderNo,
            transactionId: encryption_1.EncryptionUtil.mask(transactionId),
            amount,
            currency,
            userId: encryption_1.EncryptionUtil.mask(userId),
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付失败日志
     * @param provider 支付提供商
     * @param orderNo 订单号
     * @param reason 失败原因
     * @param userId 用户ID
     */
    static logPaymentFailure(provider, orderNo, reason, userId) {
        logger_1.logger.warn('Payment failed', {
            action: 'payment.failure',
            provider,
            orderNo,
            reason,
            userId: encryption_1.EncryptionUtil.mask(userId),
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录退款处理日志
     * @param provider 支付提供商
     * @param orderNo 订单号
     * @param refundId 退款ID
     * @param amount 退款金额
     * @param currency 货币
     * @param userId 用户ID
     */
    static logRefund(provider, orderNo, refundId, amount, currency, userId) {
        logger_1.logger.info('Refund processed', {
            action: 'payment.refund',
            provider,
            orderNo,
            refundId: encryption_1.EncryptionUtil.mask(refundId),
            amount,
            currency,
            userId: encryption_1.EncryptionUtil.mask(userId),
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付状态查询日志
     * @param provider 支付提供商
     * @param paymentId 支付ID
     * @param status 支付状态
     */
    static logPaymentStatus(provider, paymentId, status) {
        logger_1.logger.debug('Payment status queried', {
            action: 'payment.status',
            provider,
            paymentId: encryption_1.EncryptionUtil.mask(paymentId),
            status,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付异常日志
     * @param provider 支付提供商
     * @param orderNo 订单号
     * @param error 错误信息
     * @param context 上下文信息
     */
    static logPaymentError(provider, orderNo, error, context) {
        const sanitizedContext = pci_dss_1.PCIDSSUtil.sanitizeData(context);
        logger_1.logger.error('Payment error', {
            action: 'payment.error',
            provider,
            orderNo,
            error: error.message,
            stack: error.stack,
            context: sanitizedContext,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付webhook事件日志
     * @param provider 支付提供商
     * @param eventType 事件类型
     * @param eventId 事件ID
     * @param transactionId 交易ID
     */
    static logWebhookEvent(provider, eventType, eventId, transactionId) {
        logger_1.logger.info('Webhook event received', {
            action: 'payment.webhook',
            provider,
            eventType,
            eventId: encryption_1.EncryptionUtil.mask(eventId),
            transactionId: encryption_1.EncryptionUtil.mask(transactionId),
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 记录支付配置变更日志
     * @param provider 支付提供商
     * @param changeType 变更类型
     * @param changedBy 变更人
     * @param details 变更详情
     */
    static logConfigChange(provider, changeType, changedBy, details) {
        const sanitizedDetails = pci_dss_1.PCIDSSUtil.sanitizeData(details);
        logger_1.logger.info('Payment config changed', {
            action: 'payment.config.change',
            provider,
            changeType,
            changedBy: encryption_1.EncryptionUtil.mask(changedBy),
            details: sanitizedDetails,
            timestamp: new Date().toISOString()
        });
    }
}
exports.PaymentLogger = PaymentLogger;
//# sourceMappingURL=payment-logger.js.map