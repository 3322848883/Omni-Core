import { logger } from '../../utils/logger';
import { db } from '../../database';
import { StripePaymentProvider } from './stripe';
import { PayPalPaymentProvider } from './paypal';
import { AlipayPaymentProvider } from './alipay';
import { WechatPaymentProvider } from './wechat';
import { AlipayMerchantProvider } from './alipay-merchant';
import { WechatMerchantProvider } from './wechat-merchant';
import {
  IPaymentProvider,
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentWebhookEvent,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  OrderStatus,
  canTransitionOrderStatus,
} from './types';

// Payment provider instances
let stripeProvider: StripePaymentProvider | null = null;
let paypalProvider: PayPalPaymentProvider | null = null;
let alipayProvider: AlipayPaymentProvider | null = null;
let wechatProvider: WechatPaymentProvider | null = null;
let alipayMerchantProvider: AlipayMerchantProvider | null = null;
let wechatMerchantProvider: WechatMerchantProvider | null = null;

/**
 * Initialize payment providers
 */
export function initializePaymentProviders(): void {
  try {
    // Initialize Stripe if configured
    try {
      stripeProvider = new StripePaymentProvider();
      logger.info('Stripe payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Stripe payment provider:', error);
    }

    // Initialize PayPal if configured
    try {
      paypalProvider = new PayPalPaymentProvider();
      logger.info('PayPal payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize PayPal payment provider:', error);
    }

    // Initialize Alipay if configured
    try {
      alipayProvider = new AlipayPaymentProvider();
      logger.info('Alipay payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Alipay payment provider:', error);
    }

    // Initialize WeChat if configured
    try {
      wechatProvider = new WechatPaymentProvider();
      logger.info('WeChat payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize WeChat payment provider:', error);
    }

    // Initialize Alipay Merchant if configured
    try {
      alipayMerchantProvider = new AlipayMerchantProvider();
      logger.info('Alipay merchant payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Alipay merchant payment provider:', error);
    }

    // Initialize WeChat Merchant if configured
    try {
      wechatMerchantProvider = new WechatMerchantProvider();
      logger.info('WeChat merchant payment provider initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize WeChat merchant payment provider:', error);
    }

    const initializedProviders = getAvailableProviders();
    if (initializedProviders.length === 0) {
      logger.warn('No payment providers initialized. Payment functionality will be unavailable.');
    } else {
      logger.info(`Initialized payment providers: ${initializedProviders.join(', ')}`);
    }
  } catch (error) {
    logger.error('Failed to initialize payment providers:', error);
  }
}

/**
 * Get payment provider by name
 */
export function getPaymentProvider(provider: PaymentProvider): IPaymentProvider {
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
export function getAvailableProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  if (stripeProvider) {providers.push('stripe');}
  if (paypalProvider) {providers.push('paypal');}
  if (alipayProvider) {providers.push('alipay');}
  if (wechatProvider) {providers.push('wechat');}
  if (alipayMerchantProvider) {providers.push('alipay_merchant');}
  if (wechatMerchantProvider) {providers.push('wechat_merchant');}
  return providers;
}

/**
 * Check if provider is a QR code based payment (manual confirmation required)
 */
export function isQRCodePayment(provider: PaymentProvider): boolean {
  return provider === 'alipay' || provider === 'wechat';
}

/**
 * Get QR code info for payment provider
 */
export function getQRCodeInfo(provider: PaymentProvider): {
  qrCodeUrl: string;
  receiverName: string;
  instructions: string;
} | null {
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
export async function createPayment(
  provider: PaymentProvider,
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  const paymentProvider = getPaymentProvider(provider);

  // Update order with payment method
  await db('orders')
    .where('id', request.orderId)
    .update({
      payment_method: provider,
      updated_at: new Date(),
    });

  // Create payment with provider
  const response = await paymentProvider.createPayment(request);

  // Store payment intent ID if available
  if (response.paymentIntentId) {
    await db('orders')
      .where('id', request.orderId)
      .update({
        payment_id: response.paymentIntentId,
        updated_at: new Date(),
      });
  }

  return response;
}

/**
 * Process payment success webhook
 */
export async function processPaymentSuccess(
  provider: PaymentProvider,
  event: PaymentWebhookEvent
): Promise<void> {
  const paymentProvider = getPaymentProvider(provider);
  const paymentData = await paymentProvider.handlePaymentSuccess(event);

  // Find order by metadata or payment ID
  const orderId = paymentData.metadata?.orderId;
  if (!orderId) {
    throw new Error('Order ID not found in payment metadata');
  }

  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Check if order can transition to paid status
  if (!canTransitionOrderStatus(order.status as OrderStatus, 'paid')) {
    logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to paid`);
    return;
  }

  const now = new Date();
  const startDate = now;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (order.duration_days || 30));

  // Update order status
  await db('orders')
    .where('id', order.id)
    .update({
      status: 'paid',
      payment_time: now,
      start_date: startDate,
      end_date: endDate,
      updated_at: now,
    });

  // Log status change
  await db('order_status_logs').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'paid',
    changed_by: 'system',
    reason: `Payment received via ${provider}`,
  });

  // Update user traffic limit and expire date
  if (order.traffic_limit) {
    await db('users')
      .where('user_id', order.user_id)
      .update({
        traffic_limit: db.raw('traffic_limit + ?', [order.traffic_limit]),
        expire_date: endDate,
        updated_at: now,
      });
  }

  logger.info(`Payment success processed for order: ${order.order_no}`);
}

/**
 * Process payment failure webhook
 */
export async function processPaymentFailure(
  provider: PaymentProvider,
  event: PaymentWebhookEvent
): Promise<void> {
  const paymentProvider = getPaymentProvider(provider);
  const failureData = await paymentProvider.handlePaymentFailure(event);

  // Find order by payment ID
  const order = await db('orders')
    .where('payment_id', failureData.providerOrderId)
    .first();

  if (!order) {
    logger.warn(`Order not found for failed payment: ${failureData.providerOrderId}`);
    return;
  }

  // Check if order can transition to cancelled status
  if (!canTransitionOrderStatus(order.status as OrderStatus, 'cancelled')) {
    logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to cancelled`);
    return;
  }

  // Update order status
  await db('orders')
    .where('id', order.id)
    .update({
      status: 'cancelled',
      updated_at: new Date(),
    });

  // Log status change
  await db('order_status_logs').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'cancelled',
    changed_by: 'system',
    reason: `Payment failed: ${failureData.reason || 'Unknown reason'}`,
  });

  logger.info(`Payment failure processed for order: ${order.order_no}`);
}

/**
 * Process refund webhook
 */
export async function processRefundWebhook(
  provider: PaymentProvider,
  event: PaymentWebhookEvent
): Promise<void> {
  const paymentProvider = getPaymentProvider(provider);
  const refundData = await paymentProvider.handleRefund(event);

  // Find order by payment ID
  const order = await db('orders')
    .where('payment_id', refundData.providerOrderId)
    .first();

  if (!order) {
    logger.warn(`Order not found for refund: ${refundData.providerOrderId}`);
    return;
  }

  // Check if order can transition to refunded status
  if (!canTransitionOrderStatus(order.status as OrderStatus, 'refunded')) {
    logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to refunded`);
    return;
  }

  const now = new Date();

  // Update order status
  await db('orders')
    .where('id', order.id)
    .update({
      status: 'refunded',
      updated_at: now,
    });

  // Log status change
  await db('order_status_logs').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'refunded',
    changed_by: 'system',
    reason: `Refund processed: ${refundData.refundId}`,
  });

  // Deduct user traffic limit
  if (order.traffic_limit) {
    await db('users')
      .where('user_id', order.user_id)
      .update({
        traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
        updated_at: now,
      });
  }

  logger.info(`Refund processed for order: ${order.order_no}`);
}

/**
 * Process refund request
 */
export async function processRefund(
  orderId: string,
  amount?: number,
  reason?: string,
  changedBy: string = 'system'
): Promise<RefundResponse> {
  // Find order
  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Check if order can be refunded
  if (order.status !== 'paid' && order.status !== 'completed') {
    throw new Error(`Order cannot be refunded. Current status: ${order.status}`);
  }

  if (!order.payment_method || !order.payment_id) {
    throw new Error('Order does not have payment information');
  }

  const provider = order.payment_method as PaymentProvider;
  const paymentProvider = getPaymentProvider(provider);

  // Process refund with provider
  const refundRequest: RefundRequest = {
    paymentId: order.payment_id,
    amount,
    reason,
  };

  const refundResult = await paymentProvider.processRefund(refundRequest);

  if (refundResult.success) {
    const now = new Date();

    // Update order status
    await db('orders')
      .where('id', order.id)
      .update({
        status: 'refunded',
        updated_at: now,
      });

    // Log status change
    await db('order_status_logs').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'refunded',
      changed_by: changedBy,
      reason: reason || 'Order refunded',
    });

    // Deduct user traffic limit
    if (order.traffic_limit) {
      await db('users')
        .where('user_id', order.user_id)
        .update({
          traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
          updated_at: now,
        });
    }

    logger.info(`Refund processed for order: ${order.order_no} by ${changedBy}`);
  }

  return refundResult;
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  provider: PaymentProvider,
  paymentId: string
): Promise<PaymentStatusResponse> {
  const paymentProvider = getPaymentProvider(provider);
  return paymentProvider.getPaymentStatus(paymentId);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  provider: PaymentProvider,
  payload: string,
  signature: string
): boolean {
  try {
    const paymentProvider = getPaymentProvider(provider);
    const secret = getWebhookSecret(provider);
    return paymentProvider.verifyWebhookSignature(payload, signature, secret);
  } catch (error) {
    logger.error(`Webhook signature verification failed for ${provider}:`, error);
    return false;
  }
}

/**
 * Parse webhook event
 */
export function parseWebhookEvent(
  provider: PaymentProvider,
  rawBody: string,
  signature: string
): PaymentWebhookEvent {
  const paymentProvider = getPaymentProvider(provider);
  return paymentProvider.parseWebhookEvent(rawBody, signature);
}

/**
 * Get webhook secret for provider
 */
function getWebhookSecret(provider: PaymentProvider): string {
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
export async function completeOrder(orderId: string, changedBy: string = 'system'): Promise<void> {
  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (!canTransitionOrderStatus(order.status as OrderStatus, 'completed')) {
    throw new Error(`Order cannot be completed. Current status: ${order.status}`);
  }

  await db('orders')
    .where('id', order.id)
    .update({
      status: 'completed',
      updated_at: new Date(),
    });

  await db('order_status_logs').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'completed',
    changed_by: changedBy,
    reason: 'Order completed',
  });

  logger.info(`Order completed: ${order.order_no} by ${changedBy}`);
}

// Re-export types
export * from './types';
