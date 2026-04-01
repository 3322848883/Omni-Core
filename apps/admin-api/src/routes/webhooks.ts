import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import {
  parseWebhookEvent,
  verifyWebhookSignature,
  processPaymentSuccess,
  processPaymentFailure,
  processRefundWebhook,
  PaymentProvider,
} from '../services/payment';

const router = Router();

/**
 * Stripe webhook handler
 * POST /webhooks/stripe
 */
router.post('/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new ValidationError([
        { field: 'stripe-signature', message: 'Missing Stripe signature header' }
      ]);
    }

    // Get raw body for signature verification
    const rawBody = req.body;

    // Verify signature
    const isValid = verifyWebhookSignature('stripe', rawBody, signature);
    if (!isValid) {
      logger.warn('Invalid Stripe webhook signature');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature'
        }
      });
    }

    // Parse webhook event
    const event = parseWebhookEvent('stripe', rawBody, signature);

    logger.info(`Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.amount_capturable_updated':
        await processPaymentSuccess('stripe', event);
        break;

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await processPaymentFailure('stripe', event);
        break;

      case 'charge.refunded':
      case 'charge.refund.updated':
        await processRefundWebhook('stripe', event);
        break;

      default:
        logger.info(`Unhandled Stripe webhook event type: ${event.type}`);
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
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
    next(error);
  }
});

/**
 * PayPal webhook handler
 * POST /webhooks/paypal
 */
router.post('/paypal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // PayPal uses different headers for verification
    const transmissionId = req.headers['paypal-transmission-id'] as string;
    const certId = req.headers['paypal-cert-id'] as string;
    const authAlgo = req.headers['paypal-auth-algo'] as string;
    const transmissionTime = req.headers['paypal-transmission-time'] as string;
    const signature = req.headers['paypal-transmission-sig'] as string;

    if (!signature || !transmissionId) {
      throw new ValidationError([
        { field: 'paypal-signature', message: 'Missing PayPal signature headers' }
      ]);
    }

    // Get raw body
    const rawBody = JSON.stringify(req.body);

    // Verify signature (simplified - in production, verify certificate chain)
    const isValid = verifyWebhookSignature('paypal', rawBody, signature);
    if (!isValid) {
      logger.warn('Invalid PayPal webhook signature');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature'
        }
      });
    }

    // Parse webhook event
    const event = parseWebhookEvent('paypal', rawBody, signature);

    logger.info(`Processing PayPal webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await processPaymentSuccess('paypal', event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
      case 'CHECKOUT.ORDER.APPROVED':
        // For PayPal, we may need to capture the order after approval
        logger.info(`PayPal event ${event.type} received, may require additional processing`);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await processRefundWebhook('paypal', event);
        break;

      default:
        logger.info(`Unhandled PayPal webhook event type: ${event.type}`);
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
  } catch (error) {
    logger.error('PayPal webhook processing error:', error);
    next(error);
  }
});

/**
 * Generic webhook status check
 * GET /webhooks/status
 */
router.get('/status', (req: Request, res: Response) => {
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

export { router as webhookRoutes };
