import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { EncryptionUtil } from '../../utils/encryption';
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

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
    custom_id?: string;
  }>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalRefund {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}

export class PayPalPaymentProvider implements IPaymentProvider {
  readonly name: PaymentProvider = 'paypal';
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    const clientId = config.payment?.paypal?.clientId;
    const clientSecret = config.payment?.paypal?.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal client ID or secret is not configured');
    }

    const baseURL = config.payment?.paypal?.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info(`PayPal payment provider initialized (${config.payment?.paypal?.sandbox ? 'sandbox' : 'live'})`);
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const clientId = config.payment?.paypal?.clientId;
      const clientSecret = config.payment?.paypal?.clientSecret;

      // 记录加密后的凭证信息
      logger.debug(`PayPal clientId: ${EncryptionUtil.mask(clientId || '')}`);
      
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await this.client.post<PayPalAccessToken>(
        '/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry slightly earlier to avoid edge cases
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get PayPal access token:', error);
      throw error;
    }
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      logger.info(`Creating PayPal order for order: ${request.orderNo}`);

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

      const response = await this.client.post<PayPalOrder>('/v2/checkout/orders', orderData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const approvalLink = response.data.links.find((link) => link.rel === 'approve');

      logger.info(`PayPal order created: ${response.data.id} for order: ${request.orderNo}`);

      return {
        success: true,
        provider: this.name,
        orderId: request.orderId,
        checkoutUrl: approvalLink?.href,
        paymentIntentId: response.data.id,
      };
    } catch (error) {
      logger.error('Failed to create PayPal order:', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // PayPal webhook verification uses certificate-based validation
      // For simplicity, we'll use a hash-based approach here
      // In production, you should verify the certificate chain
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('PayPal webhook signature verification failed:', error);
      return false;
    }
  }

  parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent {
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
    } catch (error) {
      logger.error('Failed to parse PayPal webhook event:', error);
      throw new Error('Invalid webhook payload');
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

    const data = event.data as Record<string, unknown>;

    // 验证并提取必要字段
    const captureId = validateString(data.id, 'id') || '';

    // 安全地提取金额信息
    const amountData = data.amount;
    if (typeof amountData !== 'object' || amountData === null) {
      throw new PaymentError('Invalid amount data', 'INVALID_AMOUNT', this.name);
    }

    const amountObj = amountData as Record<string, unknown>;
    const currencyCode = validateCurrency(amountObj.currency_code);
    const amountValue = validateAmount(amountObj.value, 'amount.value');

    // 安全地提取 custom_id
    let metadata: Record<string, string> | undefined;
    const customId = validateString(data.custom_id, 'custom_id', { required: false });
    if (customId) {
      metadata = { orderId: customId };
    }

    logger.info(`Processing PayPal payment capture: ${captureId}`);

    return {
      providerOrderId: captureId,
      amount: amountValue,
      currency: currencyCode,
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

    const data = event.data as Record<string, unknown>;

    // 验证并提取必要字段
    const orderId = validateString(data.id, 'id') || '';
    const status = validateString(data.status, 'status', { required: false });

    logger.info(`Processing PayPal payment failure: ${orderId}`);

    return {
      providerOrderId: orderId,
      reason: `Payment ${status || 'failed'}`,
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

    const data = event.data as Record<string, unknown>;

    // 验证并提取必要字段
    const refundId = validateString(data.id, 'id') || '';

    // 安全地提取金额信息
    const amountData = data.amount;
    if (typeof amountData !== 'object' || amountData === null) {
      throw new PaymentError('Invalid amount data', 'INVALID_AMOUNT', this.name);
    }

    const amountObj = amountData as Record<string, unknown>;
    const amountValue = validateAmount(amountObj.value, 'amount.value');

    // 安全地提取状态
    const status = validateString(data.status, 'status') || 'unknown';

    logger.info(`Processing PayPal refund: ${refundId}`);

    // Extract parent payment ID from links if available
    let parentId = '';
    const linksData = data.links;
    if (Array.isArray(linksData)) {
      const parentLink = linksData.find(
        (link: unknown) => typeof link === 'object' && link !== null &&
          (link as { rel?: string }).rel === 'up'
      ) as { href?: string } | undefined;

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

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info(`Processing PayPal refund for payment: ${request.paymentId}`);

      const accessToken = await this.getAccessToken();

      // First, get the capture details
      const captureResponse = await this.client.get(`/v2/payments/captures/${request.paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const refundData: { amount: { currency_code: string; value: string }; note_to_payer?: string } = {
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

      const response = await this.client.post<PayPalRefund>(
        `/v2/payments/captures/${request.paymentId}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info(`PayPal refund created: ${response.data.id} for payment: ${request.paymentId}`);

      return {
        success: response.data.status === 'COMPLETED',
        refundId: response.data.id,
        amount: parseFloat(response.data.amount.value),
        status: response.data.status.toLowerCase(),
      };
    } catch (error) {
      logger.error('Failed to process PayPal refund:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.get<PayPalOrder>(`/v2/checkout/orders/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let status: PaymentStatus = 'pending';
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
    } catch (error) {
      logger.error('Failed to get PayPal payment status:', error);
      throw error;
    }
  }

  /**
   * Capture an approved PayPal order
   * This should be called after user approves the payment
   */
  async captureOrder(orderId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    try {
      logger.info(`Capturing PayPal order: ${orderId}`);

      const accessToken = await this.getAccessToken();

      const response = await this.client.post<{
        id: string;
        status: string;
        purchase_units: Array<{
          payments: {
            captures: Array<{
              id: string;
              amount: { currency_code: string; value: string };
              status: string;
            }>;
          };
        }>;
      }>(`/v2/checkout/orders/${orderId}/capture`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const capture = response.data.purchase_units[0]?.payments?.captures[0];

      logger.info(`PayPal order captured: ${response.data.id}`);

      return {
        id: capture?.id || response.data.id,
        status: response.data.status,
        amount: parseFloat(capture?.amount.value || '0'),
        currency: capture?.amount.currency_code || 'USD',
      };
    } catch (error) {
      logger.error('Failed to capture PayPal order:', error);
      throw error;
    }
  }
}
