"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFlowManager = exports.PaymentFlowManager = exports.paymentAggregator = exports.PaymentAggregator = void 0;
exports.initializePaymentProviders = initializePaymentProviders;
exports.getPaymentProvider = getPaymentProvider;
exports.getAvailableProviders = getAvailableProviders;
exports.isQRCodePayment = isQRCodePayment;
exports.getQRCodeInfo = getQRCodeInfo;
exports.createPayment = createPayment;
exports.processPaymentSuccess = processPaymentSuccess;
exports.processPaymentFailure = processPaymentFailure;
exports.processRefundWebhook = processRefundWebhook;
exports.processRefund = processRefund;
exports.getPaymentStatus = getPaymentStatus;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.parseWebhookEvent = parseWebhookEvent;
exports.completeOrder = completeOrder;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
const stripe_1 = require("./stripe");
const paypal_1 = require("./paypal");
const alipay_1 = require("./alipay");
const wechat_1 = require("./wechat");
const alipay_merchant_1 = require("./alipay-merchant");
const wechat_merchant_1 = require("./wechat-merchant");
const aggregator_1 = require("./aggregator");
Object.defineProperty(exports, "PaymentAggregator", { enumerable: true, get: function () { return aggregator_1.PaymentAggregator; } });
Object.defineProperty(exports, "paymentAggregator", { enumerable: true, get: function () { return aggregator_1.paymentAggregator; } });
const payment_flow_manager_1 = require("./payment-flow-manager");
Object.defineProperty(exports, "PaymentFlowManager", { enumerable: true, get: function () { return payment_flow_manager_1.PaymentFlowManager; } });
Object.defineProperty(exports, "paymentFlowManager", { enumerable: true, get: function () { return payment_flow_manager_1.paymentFlowManager; } });
const types_1 = require("./types");
// Payment provider instances
let stripeProvider = null;
let paypalProvider = null;
let alipayProvider = null;
let wechatProvider = null;
let alipayMerchantProvider = null;
let wechatMerchantProvider = null;
/**
 * Initialize payment providers
 */
function initializePaymentProviders() {
    try {
        // Initialize Stripe if configured
        try {
            stripeProvider = new stripe_1.StripePaymentProvider();
            logger_1.logger.info('Stripe payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize Stripe payment provider:', error);
        }
        // Initialize PayPal if configured
        try {
            paypalProvider = new paypal_1.PayPalPaymentProvider();
            logger_1.logger.info('PayPal payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize PayPal payment provider:', error);
        }
        // Initialize Alipay if configured
        try {
            alipayProvider = new alipay_1.AlipayPaymentProvider();
            logger_1.logger.info('Alipay payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize Alipay payment provider:', error);
        }
        // Initialize WeChat if configured
        try {
            wechatProvider = new wechat_1.WechatPaymentProvider();
            logger_1.logger.info('WeChat payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize WeChat payment provider:', error);
        }
        // Initialize Alipay Merchant if configured
        try {
            alipayMerchantProvider = new alipay_merchant_1.AlipayMerchantProvider();
            logger_1.logger.info('Alipay merchant payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize Alipay merchant payment provider:', error);
        }
        // Initialize WeChat Merchant if configured
        try {
            wechatMerchantProvider = new wechat_merchant_1.WechatMerchantProvider();
            logger_1.logger.info('WeChat merchant payment provider initialized successfully');
        }
        catch (error) {
            logger_1.logger.warn('Failed to initialize WeChat merchant payment provider:', error);
        }
        const initializedProviders = getAvailableProviders();
        if (initializedProviders.length === 0) {
            logger_1.logger.warn('No payment providers initialized. Payment functionality will be unavailable.');
        }
        else {
            logger_1.logger.info(`Initialized payment providers: ${initializedProviders.join(', ')}`);
        }
        // Initialize payment aggregator
        (0, aggregator_1.initializePaymentAggregator)();
        logger_1.logger.info('Payment aggregator initialized');
        // Initialize payment flow manager
        (0, payment_flow_manager_1.initializePaymentFlowManager)();
        logger_1.logger.info('Payment flow manager initialized');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize payment providers:', error);
    }
}
/**
 * Get payment provider by name
 */
function getPaymentProvider(provider) {
    switch (provider) {
        case 'stripe':
            if (!stripeProvider) {
                throw new Error('Stripe payment provider is not initialized');
            }
            return stripeProvider;
        case 'paypal':
            if (!paypalProvider) {
                throw new Error('PayPal payment provider is not initialized');
            }
            return paypalProvider;
        case 'alipay':
            if (!alipayProvider) {
                throw new Error('Alipay payment provider is not initialized');
            }
            return alipayProvider;
        case 'wechat':
            if (!wechatProvider) {
                throw new Error('WeChat payment provider is not initialized');
            }
            return wechatProvider;
        case 'alipay_merchant':
            if (!alipayMerchantProvider) {
                throw new Error('Alipay merchant payment provider is not initialized');
            }
            return alipayMerchantProvider;
        case 'wechat_merchant':
            if (!wechatMerchantProvider) {
                throw new Error('WeChat merchant payment provider is not initialized');
            }
            return wechatMerchantProvider;
        default:
            throw new Error(`Unknown payment provider: ${provider}`);
    }
}
/**
 * Get available payment providers
 */
function getAvailableProviders() {
    const providers = [];
    if (stripeProvider) {
        providers.push('stripe');
    }
    if (paypalProvider) {
        providers.push('paypal');
    }
    if (alipayProvider) {
        providers.push('alipay');
    }
    if (wechatProvider) {
        providers.push('wechat');
    }
    if (alipayMerchantProvider) {
        providers.push('alipay_merchant');
    }
    if (wechatMerchantProvider) {
        providers.push('wechat_merchant');
    }
    return providers;
}
/**
 * Check if provider is a QR code based payment (manual confirmation required)
 */
function isQRCodePayment(provider) {
    return provider === 'alipay' || provider === 'wechat';
}
/**
 * Get QR code info for payment provider
 */
function getQRCodeInfo(provider) {
    switch (provider) {
        case 'alipay':
            return alipayProvider?.getQRCodeInfo() || null;
        case 'wechat':
            return wechatProvider?.getQRCodeInfo() || null;
        default:
            return null;
    }
}
/**
 * Create a payment for an order
 */
async function createPayment(provider, request) {
    // 使用支付流程管理器处理支付创建
    return payment_flow_manager_1.paymentFlowManager.createPaymentFlow(provider, request);
}
/**
 * Process payment success webhook
 */
async function processPaymentSuccess(provider, event) {
    // 直接使用支付聚合器处理支付成功
    await aggregator_1.paymentAggregator.processPaymentSuccess(provider, event);
}
/**
 * Process payment failure webhook
 */
async function processPaymentFailure(provider, event) {
    // 直接使用支付聚合器处理支付失败
    await aggregator_1.paymentAggregator.processPaymentFailure(provider, event);
}
/**
 * Process refund webhook
 */
async function processRefundWebhook(provider, event) {
    const paymentProvider = getPaymentProvider(provider);
    const refundData = await paymentProvider.handleRefund(event);
    // Find order by payment ID
    const order = await (0, database_1.db)('orders')
        .where('payment_id', refundData.providerOrderId)
        .first();
    if (!order) {
        logger_1.logger.warn(`Order not found for refund: ${refundData.providerOrderId}`);
        return;
    }
    // Check if order can transition to refunded status
    if (!(0, types_1.canTransitionOrderStatus)(order.status, 'refunded')) {
        logger_1.logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to refunded`);
        return;
    }
    const now = new Date();
    // Update order status
    await (0, database_1.db)('orders')
        .where('id', order.id)
        .update({
        status: 'refunded',
        updated_at: now,
    });
    // Log status change
    await (0, database_1.db)('order_status_logs').insert({
        order_id: order.id,
        from_status: order.status,
        to_status: 'refunded',
        changed_by: 'system',
        reason: `Refund processed: ${refundData.refundId}`,
    });
    // Deduct user traffic limit
    if (order.traffic_limit) {
        await (0, database_1.db)('users')
            .where('user_id', order.user_id)
            .update({
            traffic_limit: database_1.db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
            updated_at: now,
        });
    }
    logger_1.logger.info(`Refund processed for order: ${order.order_no}`);
}
/**
 * Process refund request
 */
async function processRefund(orderId, amount, reason, changedBy = 'system') {
    // 使用支付流程管理器处理退款
    return payment_flow_manager_1.paymentFlowManager.processRefund(orderId, amount, reason, changedBy);
}
/**
 * Get payment status
 */
async function getPaymentStatus(provider, paymentId) {
    // 使用支付流程管理器获取支付状态
    return payment_flow_manager_1.paymentFlowManager.getPaymentStatus(provider, paymentId);
}
/**
 * Verify webhook signature
 */
function verifyWebhookSignature(provider, payload, signature) {
    // 使用支付聚合器验证签名
    return aggregator_1.paymentAggregator.verifyWebhookSignature(provider, payload, signature);
}
/**
 * Parse webhook event
 */
function parseWebhookEvent(provider, rawBody, signature) {
    // 使用支付聚合器解析事件
    return aggregator_1.paymentAggregator.parseWebhookEvent(provider, rawBody, signature);
}
/**
 * Get webhook secret for provider
 */
function getWebhookSecret(provider) {
    const { config: appConfig } = require('../../config');
    switch (provider) {
        case 'stripe':
            return appConfig.payment?.stripe?.webhookSecret || '';
        case 'paypal':
            return appConfig.payment?.paypal?.webhookSecret || '';
        default:
            return '';
    }
}
/**
 * Complete order (transition from paid to completed)
 */
async function completeOrder(orderId, changedBy = 'system') {
    const order = await (0, database_1.db)('orders').where('id', orderId).first();
    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }
    if (!(0, types_1.canTransitionOrderStatus)(order.status, 'completed')) {
        throw new Error(`Order cannot be completed. Current status: ${order.status}`);
    }
    await (0, database_1.db)('orders')
        .where('id', order.id)
        .update({
        status: 'completed',
        updated_at: new Date(),
    });
    await (0, database_1.db)('order_status_logs').insert({
        order_id: order.id,
        from_status: order.status,
        to_status: 'completed',
        changed_by: changedBy,
        reason: 'Order completed',
    });
    logger_1.logger.info(`Order completed: ${order.order_no} by ${changedBy}`);
}
// Re-export types, aggregator, and flow manager
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map