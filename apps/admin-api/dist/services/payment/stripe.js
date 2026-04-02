"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentProvider = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
const types_1 = require("./types");
class StripePaymentProvider {
    name = 'stripe';
    client;
    constructor() {
        const secretKey = config_1.config.payment?.stripe?.secretKey;
        if (!secretKey) {
            throw new Error('Stripe secret key is not configured');
        }
        this.client = new stripe_1.default(secretKey, {
            apiVersion: '2023-10-16',
            typescript: true,
        });
        logger_1.logger.info('Stripe payment provider initialized');
    }
    async createPayment(request) {
        try {
            logger_1.logger.info(`Creating Stripe payment intent for order: ${request.orderNo}`);
            // Convert amount to cents (Stripe uses smallest currency unit)
            const amountInCents = Math.round(request.amount * 100);
            const paymentIntent = await this.client.paymentIntents.create({
                amount: amountInCents,
                currency: request.currency.toLowerCase(),
                description: request.description,
                metadata: {
                    orderId: request.orderId,
                    orderNo: request.orderNo,
                    userId: request.userId,
                    ...request.metadata,
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            logger_1.logger.info(`Stripe payment intent created: ${paymentIntent.id} for order: ${request.orderNo}`);
            return {
                success: true,
                provider: this.name,
                orderId: request.orderId,
                clientSecret: paymentIntent.client_secret || undefined,
                paymentIntentId: paymentIntent.id,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create Stripe payment intent:', error);
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature, secret) {
        try {
            const event = this.client.webhooks.constructEvent(payload, signature, secret);
            return !!event;
        }
        catch (error) {
            logger_1.logger.error('Stripe webhook signature verification failed:', error);
            return false;
        }
    }
    parseWebhookEvent(rawBody, signature) {
        const secret = config_1.config.payment?.stripe?.webhookSecret;
        if (!secret) {
            throw new Error('Stripe webhook secret is not configured');
        }
        try {
            const event = this.client.webhooks.constructEvent(rawBody, signature, secret);
            return {
                id: event.id,
                type: event.type,
                provider: this.name,
                data: event.data.object,
                signature,
                rawBody,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse Stripe webhook event:', error);
            throw new Error('Invalid webhook signature');
        }
    }
    async handlePaymentSuccess(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const paymentIntent = event.data;
        // 验证必要字段
        if (!paymentIntent.id) {
            throw new types_1.PaymentError('PaymentIntent ID is missing', 'MISSING_FIELD', this.name);
        }
        if (typeof paymentIntent.amount !== 'number') {
            throw new types_1.PaymentError('PaymentIntent amount is invalid', 'INVALID_AMOUNT', this.name);
        }
        if (typeof paymentIntent.currency !== 'string') {
            throw new types_1.PaymentError('PaymentIntent currency is invalid', 'INVALID_CURRENCY', this.name);
        }
        logger_1.logger.info(`Processing Stripe payment success: ${paymentIntent.id}`);
        // 安全地处理 metadata
        let metadata = {};
        if (paymentIntent.metadata && typeof paymentIntent.metadata === 'object') {
            metadata = Object.entries(paymentIntent.metadata).reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
            }, {});
        }
        return {
            providerOrderId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.currency.toUpperCase(),
            metadata,
        };
    }
    async handlePaymentFailure(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const paymentIntent = event.data;
        // 验证必要字段
        if (!paymentIntent.id) {
            throw new types_1.PaymentError('PaymentIntent ID is missing', 'MISSING_FIELD', this.name);
        }
        logger_1.logger.info(`Processing Stripe payment failure: ${paymentIntent.id}`);
        // 安全地提取错误信息
        let reason = 'Payment failed';
        if (paymentIntent.last_payment_error && typeof paymentIntent.last_payment_error === 'object') {
            const errorMessage = paymentIntent.last_payment_error.message;
            if (typeof errorMessage === 'string') {
                reason = errorMessage;
            }
        }
        return {
            providerOrderId: paymentIntent.id,
            reason,
        };
    }
    async handleRefund(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const charge = event.data;
        // 验证必要字段
        if (!charge.id) {
            throw new types_1.PaymentError('Charge ID is missing', 'MISSING_FIELD', this.name);
        }
        logger_1.logger.info(`Processing Stripe refund: ${charge.id}`);
        // 安全地提取退款数据
        let refund;
        if (charge.refunds && typeof charge.refunds === 'object') {
            const refundsData = charge.refunds.data;
            if (Array.isArray(refundsData) && refundsData.length > 0) {
                refund = refundsData[0];
            }
        }
        if (!refund) {
            throw new types_1.PaymentError('Refund data not found in charge', 'MISSING_REFUND_DATA', this.name);
        }
        // 安全地提取 payment_intent
        let paymentIntentId = '';
        if (typeof charge.payment_intent === 'string') {
            paymentIntentId = charge.payment_intent;
        }
        return {
            providerOrderId: paymentIntentId,
            refundId: refund.id,
            amount: refund.amount / 100, // Convert from cents
            status: refund.status || 'unknown',
        };
    }
    async processRefund(request) {
        try {
            logger_1.logger.info(`Processing Stripe refund for payment: ${request.paymentId}`);
            const refundParams = {
                payment_intent: request.paymentId,
            };
            // If amount is specified, do partial refund
            if (request.amount) {
                refundParams.amount = Math.round(request.amount * 100);
            }
            if (request.reason) {
                refundParams.reason = 'requested_by_customer';
            }
            const refund = await this.client.refunds.create(refundParams);
            logger_1.logger.info(`Stripe refund created: ${refund.id} for payment: ${request.paymentId}`);
            return {
                success: refund.status === 'succeeded',
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status || 'unknown',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process Stripe refund:', error);
            throw error;
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);
            let status = 'pending';
            switch (paymentIntent.status) {
                case 'requires_payment_method':
                case 'requires_confirmation':
                case 'requires_action':
                case 'processing':
                    status = 'processing';
                    break;
                case 'succeeded':
                    status = 'paid';
                    break;
                case 'canceled':
                    status = 'cancelled';
                    break;
                default:
                    status = 'pending';
            }
            // Get charges for the payment intent to find payment time
            const charges = await this.client.charges.list({
                payment_intent: paymentId,
                limit: 1,
            });
            return {
                orderId: paymentIntent.metadata?.orderId || '',
                status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                paidAt: charges.data[0]?.created
                    ? new Date(charges.data[0].created * 1000)
                    : undefined,
                providerOrderId: paymentIntent.id,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Stripe payment status:', error);
            throw error;
        }
    }
}
exports.StripePaymentProvider = StripePaymentProvider;
//# sourceMappingURL=stripe.js.map