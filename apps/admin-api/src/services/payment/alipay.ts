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
} from './types';

/**
 * 支付宝个人收款码支付提供商
 * 
 * 实现原理：
 * 1. 管理员上传支付宝收款码图片
 * 2. 用户下单后看到收款码和转账金额
 * 3. 用户扫码转账并备注订单号
 * 4. 管理员在后台确认收款后手动标记订单为已支付
 * 
 * 注意：这是个人收款码方案，不需要企业资质
 */
export class AlipayPaymentProvider implements IPaymentProvider {
  readonly name: PaymentProvider = 'alipay';
  private qrCodeUrl: string;
  private receiverName: string;

  constructor() {
    this.qrCodeUrl = config.payment?.alipay?.qrCodeUrl || '';
    this.receiverName = config.payment?.alipay?.receiverName || '';

    if (!this.qrCodeUrl) {
      logger.warn('Alipay QR code URL is not configured');
    }

    logger.info('Alipay personal QR code payment provider initialized');
  }

  /**
   * 创建支付
   * 返回收款码URL和转账信息
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      logger.info(`Creating Alipay payment for order: ${request.orderNo}`);

      // 生成支付说明
      const paymentDescription = `FGVPN-${request.orderNo}`;

      return {
        success: true,
        provider: this.name,
        orderId: request.orderId,
        // 返回收款码URL
        checkoutUrl: this.qrCodeUrl,
        // 使用订单号作为支付ID
        paymentIntentId: request.orderNo,
      };
    } catch (error) {
      logger.error('Failed to create Alipay payment:', error);
      throw error;
    }
  }

  /**
   * 验证 Webhook 签名
   * 个人收款码不支持自动回调，返回 false
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // 个人收款码不支持 webhook
    return false;
  }

  /**
   * 解析 Webhook 事件
   * 个人收款码不支持 webhook
   */
  parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent {
    throw new Error('Alipay personal QR code does not support webhook');
  }

  /**
   * 处理支付成功
   * 个人收款码需要手动确认
   */
  async handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }> {
    // 个人收款码不支持自动回调
    throw new Error('Alipay personal QR code requires manual confirmation');
  }

  /**
   * 处理支付失败
   */
  async handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    reason?: string;
  }> {
    throw new Error('Alipay personal QR code does not support automatic failure handling');
  }

  /**
   * 处理退款
   * 个人收款码需要手动退款
   */
  async handleRefund(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    refundId: string;
    amount: number;
    status: string;
  }> {
    throw new Error('Alipay personal QR code requires manual refund processing');
  }

  /**
   * 处理退款请求
   * 个人收款码需要手动处理
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    logger.warn('Alipay personal QR code refund must be processed manually');
    
    return {
      success: false,
      refundId: '',
      amount: request.amount || 0,
      status: 'manual_required',
    };
  }

  /**
   * 获取支付状态
   * 个人收款码需要查询订单状态
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    // 个人收款码无法自动查询状态
    // 返回 pending 状态，需要管理员手动确认
    return {
      orderId: paymentId,
      status: 'pending' as PaymentStatus,
      amount: 0,
      currency: 'CNY',
      providerOrderId: paymentId,
    };
  }

  /**
   * 获取收款码信息
   */
  getQRCodeInfo(): {
    qrCodeUrl: string;
    receiverName: string;
    instructions: string;
  } {
    return {
      qrCodeUrl: this.qrCodeUrl,
      receiverName: this.receiverName,
      instructions: '请使用支付宝扫描上方二维码完成转账，转账时请务必备注您的订单号',
    };
  }
}
