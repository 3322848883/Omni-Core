import Stripe from 'stripe';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import {
  IPaymentProvider,
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentWebhookEvent,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  PaymentStatus,
  PaymentError,
  validateAmount,
  validateString,
  validateCurrency,
} from './types';

export class StripePaymentProvider implements IPaymentProvider {
  readonly name: PaymentProvider = 'stripe';
  private client: Stripe;

  constructor() {
    const secretKey = config.payment?.stripe?.secretKey;
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.client = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    logger.info('Stripe payment provider initialized');
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      logger.info(`Creating Stripe payment intent for order: ${request.orderNo}`);

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

      logger.info(`Stripe payment intent created: ${paymentIntent.id} for order: ${request.orderNo}`);

      return {
        success: true,
        provider: this.name,
        orderId: request.orderId,
        clientSecret: paymentIntent.client_secret || undefined,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Failed to create Stripe payment intent:', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const event = this.client.webhooks.constructEvent(payload, signature, secret);
      return !!event;
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error);
      return false;
    }
  }

  parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent {
    const secret = config.payment?.stripe?.webhookSecret;
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
    } catch (error) {
      logger.error('Failed to parse Stripe webhook event:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  async handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }> {
    // 验证事件数据类型
    if (typeof event.data !== 'object' || event.data === null) {
      throw new PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
    }

    const paymentIntent = event.data as Stripe.PaymentIntent;

    // 验证必要字段
    if (!paymentIntent.id) {
      throw new PaymentError('PaymentIntent ID is missing', 'MISSING_FIELD', this.name);
    }

    if (typeof paymentIntent.amount !== 'number') {
      throw new PaymentError('PaymentIntent amount is invalid', 'INVALID_AMOUNT', this.name);
    }

    if (typeof paymentIntent.currency !== 'string') {
      throw new PaymentError('PaymentIntent currency is invalid', 'INVALID_CURRENCY', this.name);
    }

    logger.info(`Processing Stripe payment success: ${paymentIntent.id}`);

    // 安全地处理 metadata
    let metadata: Record<string, string> = {};
    if (paymentIntent.metadata && typeof paymentIntent.metadata === 'object') {
      metadata = Object.entries(paymentIntent.metadata).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
    }

    return {
      providerOrderId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      metadata,
    };
  }

  async handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    reason?: string;
  }> {
    // 验证事件数据类型
    if (typeof event.data !== 'object' || event.data === null) {
      throw new PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
    }

    const paymentIntent = event.data as Stripe.PaymentIntent;

    // 验证必要字段
    if (!paymentIntent.id) {
      throw new PaymentError('PaymentIntent ID is missing', 'MISSING_FIELD', this.name);
    }

    logger.info(`Processing Stripe payment failure: ${paymentIntent.id}`);

    // 安全地提取错误信息
    let reason = 'Payment failed';
    if (paymentIntent.last_payment_error && typeof paymentIntent.last_payment_error === 'object') {
      const errorMessage = (paymentIntent.last_payment_error as { message?: string }).message;
      if (typeof errorMessage === 'string') {
        reason = errorMessage;
      }
    }

    return {
      providerOrderId: paymentIntent.id,
      reason,
    };
  }

  async handleRefund(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    refundId: string;
    amount: number;
    status: string;
  }> {
    // 验证事件数据类型
    if (typeof event.data !== 'object' || event.data === null) {
      throw new PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
    }

    const charge = event.data as Stripe.Charge;

    // 验证必要字段
    if (!charge.id) {
      throw new PaymentError('Charge ID is missing', 'MISSING_FIELD', this.name);
    }

    logger.info(`Processing Stripe refund: ${charge.id}`);

    // 安全地提取退款数据
    let refund: { id: string; amount: number; status?: string } | undefined;

    if (charge.refunds && typeof charge.refunds === 'object') {
      const refundsData = (charge.refunds as { data?: Array<{ id: string; amount: number; status?: string }> }).data;
      if (Array.isArray(refundsData) && refundsData.length > 0) {
        refund = refundsData[0];
      }
    }

    if (!refund) {
      throw new PaymentError('Refund data not found in charge', 'MISSING_REFUND_DATA', this.name);
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

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info(`Processing Stripe refund for payment: ${request.paymentId}`);

      const refundParams: Stripe.RefundCreateParams = {
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

      logger.info(`Stripe refund created: ${refund.id} for payment: ${request.paymentId}`);

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status || 'unknown',
      };
    } catch (error) {
      logger.error('Failed to process Stripe refund:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);

      let status: PaymentStatus = 'pending';
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
    } catch (error) {
      logger.error('Failed to get Stripe payment status:', error);
      throw error;
    }
  }
}
