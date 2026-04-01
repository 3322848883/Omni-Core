"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const payment_1 = require("../services/payment");
const router = (0, express_1.Router)();
exports.webhookRoutes = router;
/**
 * Stripe webhook handler
 * POST /webhooks/stripe
 */
router.post('/stripe', async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            throw new errors_1.ValidationError([
                { field: 'stripe-signature', message: 'Missing Stripe signature header' }
            ]);
        }
        // Get raw body for signature verification
        const rawBody = req.body;
        // Verify signature
        const isValid = (0, payment_1.verifyWebhookSignature)('stripe', rawBody, signature);
        if (!isValid) {
            logger_1.logger.warn('Invalid Stripe webhook signature');
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_SIGNATURE',
                    message: 'Invalid webhook signature'
                }
            });
        }
        // Parse webhook event
        const event = (0, payment_1.parseWebhookEvent)('stripe', rawBody, signature);
        logger_1.logger.info(`Processing Stripe webhook: ${event.type}`);
        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
            case 'payment_intent.amount_capturable_updated':
                await (0, payment_1.processPaymentSuccess)('stripe', event);
                break;
            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled':
                await (0, payment_1.processPaymentFailure)('stripe', event);
                break;
            case 'charge.refunded':
            case 'charge.refund.updated':
                await (0, payment_1.processRefundWebhook)('stripe', event);
                break;
            default:
                logger_1.logger.info(`Unhandled Stripe webhook event type: ${event.type}`);
        }
        // Return 200 to acknowledge receipt
        res.json({
            success: true,
            code: 200,
            message: 'Webhook processed successfully',
            data: {
                eventId: event.id,
                type: event.type,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Stripe webhook processing error:', error);
        next(error);
    }
});
/**
 * PayPal webhook handler
 * POST /webhooks/paypal
 */
router.post('/paypal', async (req, res, next) => {
    try {
        // PayPal uses different headers for verification
        const transmissionId = req.headers['paypal-transmission-id'];
        const certId = req.headers['paypal-cert-id'];
        const authAlgo = req.headers['paypal-auth-algo'];
        const transmissionTime = req.headers['paypal-transmission-time'];
        const signature = req.headers['paypal-transmission-sig'];
        if (!signature || !transmissionId) {
            throw new errors_1.ValidationError([
                { field: 'paypal-signature', message: 'Missing PayPal signature headers' }
            ]);
        }
        // Get raw body
        const rawBody = JSON.stringify(req.body);
        // Verify signature (simplified - in production, verify certificate chain)
        const isValid = (0, payment_1.verifyWebhookSignature)('paypal', rawBody, signature);
        if (!isValid) {
            logger_1.logger.warn('Invalid PayPal webhook signature');
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_SIGNATURE',
                    message: 'Invalid webhook signature'
                }
            });
        }
        // Parse webhook event
        const event = (0, payment_1.parseWebhookEvent)('paypal', rawBody, signature);
        logger_1.logger.info(`Processing PayPal webhook: ${event.type}`);
        // Handle different event types
        switch (event.type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                await (0, payment_1.processPaymentSuccess)('paypal', event);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.REVERSED':
            case 'CHECKOUT.ORDER.APPROVED':
                // For PayPal, we may need to capture the order after approval
                logger_1.logger.info(`PayPal event ${event.type} received, may require additional processing`);
                break;
            case 'PAYMENT.CAPTURE.REFUNDED':
                await (0, payment_1.processRefundWebhook)('paypal', event);
                break;
            default:
                logger_1.logger.info(`Unhandled PayPal webhook event type: ${event.type}`);
        }
        // Return 200 to acknowledge receipt
        res.json({
            success: true,
            code: 200,
            message: 'Webhook processed successfully',
            data: {
                eventId: event.id,
                type: event.type,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('PayPal webhook processing error:', error);
        next(error);
    }
});
/**
 * Generic webhook status check
 * GET /webhooks/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        code: 200,
        message: 'Webhook endpoint is active',
        data: {
            endpoints: [
                { path: '/webhooks/stripe', method: 'POST', provider: 'stripe' },
                { path: '/webhooks/paypal', method: 'POST', provider: 'paypal' },
            ],
            timestamp: new Date().toISOString(),
        }
    });
});
//# sourceMappingURL=webhooks.js.map