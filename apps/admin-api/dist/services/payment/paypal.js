"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalPaymentProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
const encryption_1 = require("../../utils/encryption");
const types_1 = require("./types");
class PayPalPaymentProvider {
    name = 'paypal';
    client;
    accessToken = null;
    tokenExpiry = null;
    constructor() {
        const clientId = config_1.config.payment?.paypal?.clientId;
        const clientSecret = config_1.config.payment?.paypal?.clientSecret;
        if (!clientId || !clientSecret) {
            throw new Error('PayPal client ID or secret is not configured');
        }
        const baseURL = config_1.config.payment?.paypal?.sandbox
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        logger_1.logger.info(`PayPal payment provider initialized (${config_1.config.payment?.paypal?.sandbox ? 'sandbox' : 'live'})`);
    }
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            const clientId = config_1.config.payment?.paypal?.clientId;
            const clientSecret = config_1.config.payment?.paypal?.clientSecret;
            // 记录加密后的凭证信息
            logger_1.logger.debug(`PayPal clientId: ${encryption_1.EncryptionUtil.mask(clientId || '')}`);
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const response = await this.client.post('/v1/oauth2/token', 'grant_type=client_credentials', {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            this.accessToken = response.data.access_token;
            // Set expiry slightly earlier to avoid edge cases
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
            return this.accessToken;
        }
        catch (error) {
            logger_1.logger.error('Failed to get PayPal access token:', error);
            throw error;
        }
    }
    async createPayment(request) {
        try {
            logger_1.logger.info(`Creating PayPal order for order: ${request.orderNo}`);
            const accessToken = await this.getAccessToken();
            const orderData = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: request.currency.toUpperCase(),
                            value: request.amount.toFixed(2),
                        },
                        description: request.description,
                        custom_id: request.orderId,
                    },
                ],
                application_context: {
                    brand_name: 'FGVPN',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    return_url: request.returnUrl,
                    cancel_url: request.cancelUrl,
                },
            };
            const response = await this.client.post('/v2/checkout/orders', orderData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const approvalLink = response.data.links.find((link) => link.rel === 'approve');
            logger_1.logger.info(`PayPal order created: ${response.data.id} for order: ${request.orderNo}`);
            return {
                success: true,
                provider: this.name,
                orderId: request.orderId,
                checkoutUrl: approvalLink?.href,
                paymentIntentId: response.data.id,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create PayPal order:', error);
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature, secret) {
        try {
            // PayPal webhook verification uses certificate-based validation
            // For simplicity, we'll use a hash-based approach here
            // In production, you should verify the certificate chain
            const expectedSignature = crypto_1.default
                .createHmac('sha256', secret)
                .update(payload)
                .digest('base64');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            logger_1.logger.error('PayPal webhook signature verification failed:', error);
            return false;
        }
    }
    parseWebhookEvent(rawBody, signature) {
        try {
            const event = JSON.parse(rawBody);
            return {
                id: event.id,
                type: event.event_type,
                provider: this.name,
                data: event.resource,
                signature,
                rawBody,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse PayPal webhook event:', error);
            throw new Error('Invalid webhook payload');
        }
    }
    async handlePaymentSuccess(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 验证并提取必要字段
        const captureId = (0, types_1.validateString)(data.id, 'id') || '';
        // 安全地提取金额信息
        const amountData = data.amount;
        if (typeof amountData !== 'object' || amountData === null) {
            throw new types_1.PaymentError('Invalid amount data', 'INVALID_AMOUNT', this.name);
        }
        const amountObj = amountData;
        const currencyCode = (0, types_1.validateCurrency)(amountObj.currency_code);
        const amountValue = (0, types_1.validateAmount)(amountObj.value, 'amount.value');
        // 安全地提取 custom_id
        let metadata;
        const customId = (0, types_1.validateString)(data.custom_id, 'custom_id', { required: false });
        if (customId) {
            metadata = { orderId: customId };
        }
        logger_1.logger.info(`Processing PayPal payment capture: ${captureId}`);
        return {
            providerOrderId: captureId,
            amount: amountValue,
            currency: currencyCode,
            metadata,
        };
    }
    async handlePaymentFailure(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 验证并提取必要字段
        const orderId = (0, types_1.validateString)(data.id, 'id') || '';
        const status = (0, types_1.validateString)(data.status, 'status', { required: false });
        logger_1.logger.info(`Processing PayPal payment failure: ${orderId}`);
        return {
            providerOrderId: orderId,
            reason: `Payment ${status || 'failed'}`,
        };
    }
    async handleRefund(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 验证并提取必要字段
        const refundId = (0, types_1.validateString)(data.id, 'id') || '';
        // 安全地提取金额信息
        const amountData = data.amount;
        if (typeof amountData !== 'object' || amountData === null) {
            throw new types_1.PaymentError('Invalid amount data', 'INVALID_AMOUNT', this.name);
        }
        const amountObj = amountData;
        const amountValue = (0, types_1.validateAmount)(amountObj.value, 'amount.value');
        // 安全地提取状态
        const status = (0, types_1.validateString)(data.status, 'status') || 'unknown';
        logger_1.logger.info(`Processing PayPal refund: ${refundId}`);
        // Extract parent payment ID from links if available
        let parentId = '';
        const linksData = data.links;
        if (Array.isArray(linksData)) {
            const parentLink = linksData.find((link) => typeof link === 'object' && link !== null &&
                link.rel === 'up');
            if (parentLink?.href) {
                const parts = parentLink.href.split('/');
                parentId = parts[parts.length - 1] || '';
            }
        }
        return {
            providerOrderId: parentId,
            refundId,
            amount: amountValue,
            status: status.toLowerCase(),
        };
    }
    async processRefund(request) {
        try {
            logger_1.logger.info(`Processing PayPal refund for payment: ${request.paymentId}`);
            const accessToken = await this.getAccessToken();
            // First, get the capture details
            const captureResponse = await this.client.get(`/v2/payments/captures/${request.paymentId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const refundData = {
                amount: {
                    currency_code: captureResponse.data.amount.currency_code,
                    value: request.amount
                        ? request.amount.toFixed(2)
                        : captureResponse.data.amount.value,
                },
            };
            if (request.reason) {
                refundData.note_to_payer = request.reason;
            }
            const response = await this.client.post(`/v2/payments/captures/${request.paymentId}/refund`, refundData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            logger_1.logger.info(`PayPal refund created: ${response.data.id} for payment: ${request.paymentId}`);
            return {
                success: response.data.status === 'COMPLETED',
                refundId: response.data.id,
                amount: parseFloat(response.data.amount.value),
                status: response.data.status.toLowerCase(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process PayPal refund:', error);
            throw error;
        }
    }
    async getPaymentStatus(paymentId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await this.client.get(`/v2/checkout/orders/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            let status = 'pending';
            switch (response.data.status) {
                case 'CREATED':
                case 'SAVED':
                case 'APPROVED':
                    status = 'processing';
                    break;
                case 'COMPLETED':
                    status = 'paid';
                    break;
                case 'VOIDED':
                    status = 'cancelled';
                    break;
                case 'PAYER_ACTION_REQUIRED':
                    status = 'pending';
                    break;
                default:
                    status = 'pending';
            }
            const purchaseUnit = response.data.purchase_units[0];
            return {
                orderId: purchaseUnit?.custom_id || '',
                status,
                amount: parseFloat(purchaseUnit?.amount.value || '0'),
                currency: purchaseUnit?.amount.currency_code || 'USD',
                providerOrderId: response.data.id,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get PayPal payment status:', error);
            throw error;
        }
    }
    /**
     * Capture an approved PayPal order
     * This should be called after user approves the payment
     */
    async captureOrder(orderId) {
        try {
            logger_1.logger.info(`Capturing PayPal order: ${orderId}`);
            const accessToken = await this.getAccessToken();
            const response = await this.client.post(`/v2/checkout/orders/${orderId}/capture`, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const capture = response.data.purchase_units[0]?.payments?.captures[0];
            logger_1.logger.info(`PayPal order captured: ${response.data.id}`);
            return {
                id: capture?.id || response.data.id,
                status: response.data.status,
                amount: parseFloat(capture?.amount.value || '0'),
                currency: capture?.amount.currency_code || 'USD',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to capture PayPal order:', error);
            throw error;
        }
    }
}
exports.PayPalPaymentProvider = PayPalPaymentProvider;
//# sourceMappingURL=paypal.js.map