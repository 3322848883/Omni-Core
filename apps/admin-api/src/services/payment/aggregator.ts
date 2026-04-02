import { logger } from '../../utils/logger';
import { db } from '../../database';
import { PCIDSSUtil } from '../../utils/pci-dss';
import { PaymentLogger } from '../../utils/payment-logger';
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
  PaymentStatus,
  PaymentError,
} from './types';
import { getPaymentProvider, getAvailableProviders, isQRCodePayment, getQRCodeInfo } from './index';

/**
 * 支付聚合器核心类
 * 提供统一的支付处理能力，管理多个支付渠道
 */
export class PaymentAggregator {
  private static instance: PaymentAggregator;
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  /**
   * 获取支付聚合器实例（单例模式）
   */
  public static getInstance(): PaymentAggregator {
    if (!PaymentAggregator.instance) {
      PaymentAggregator.instance = new PaymentAggregator();
    }
    return PaymentAggregator.instance;
  }

  /**
   * 初始化支付提供商
   */
  private initializeProviders(): void {
    try {
      const availableProviders = getAvailableProviders();
      
      availableProviders.forEach(provider => {
        try {
          const paymentProvider = getPaymentProvider(provider);
          this.providers.set(provider, paymentProvider);
          logger.info(`Payment aggregator initialized provider: ${provider}`);
        } catch (error) {
          logger.warn(`Failed to initialize provider ${provider}:`, error);
        }
      });

      if (this.providers.size === 0) {
        logger.warn('No payment providers available in aggregator');
      } else {
        logger.info(`Payment aggregator initialized with providers: ${Array.from(this.providers.keys()).join(', ')}`);
      }
    } catch (error) {
      logger.warn('Failed to initialize providers:', error);
    }
  }

  /**
   * 获取所有可用的支付提供商
   */
  public getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 根据订单金额和货币选择最合适的支付提供商
   */
  public selectProvider(amount: number, currency: string): PaymentProvider {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new PaymentError('No payment providers available', 'NO_PROVIDERS_AVAILABLE');
    }

    // 这里可以实现更复杂的提供商选择逻辑
    // 例如：根据金额、货币、用户偏好等因素
    return availableProviders[0];
  }

  /**
   * 创建支付
   */
  public async createPayment(
    provider: PaymentProvider,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;
    
    // 验证请求数据
    this.validateCreatePaymentRequest(request);

    // PCI DSS合规检查
    const compliance = PCIDSSUtil.checkCompliance(request);
    if (!compliance.compliant) {
      logger.warn('PCI DSS compliance issues:', compliance.issues);
    }

    // 记录支付请求（不包含敏感信息）
    const sanitizedRequest = PCIDSSUtil.sanitizeData(request);
    logger.debug('Payment request:', sanitizedRequest);

    try {
      // 更新订单支付方式
      await db('orders')
        .where('id', request.orderId)
        .update({
          payment_method: provider,
          updated_at: new Date(),
        });

      // 创建支付
      const response = await paymentProvider.createPayment(request);

      // 存储支付意图ID
      if (response.paymentIntentId) {
        await db('orders')
          .where('id', request.orderId)
          .update({
            payment_id: response.paymentIntentId,
            updated_at: new Date(),
          });
      }

      // 记录支付创建成功日志
      PaymentLogger.logPaymentCreate(
        provider,
        request.orderNo,
        request.amount,
        request.currency,
        request.userId,
        request.metadata
      );
      
      logger.info(`Payment created successfully via ${provider} for order: ${request.orderNo}`);
      return response;
    } catch (error) {
      // 记录支付错误日志
      if (error instanceof Error) {
        PaymentLogger.logPaymentError(
          provider,
          request.orderNo,
          error,
          { amount: request.amount, currency: request.currency, userId: request.userId }
        );
      }
      
      logger.error(`Failed to create payment via ${provider}:`, error);
      throw new PaymentError(
        `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PAYMENT_CREATION_FAILED',
        provider
      );
    }
  }

  /**
   * 处理支付成功
   */
  public async processPaymentSuccess(
    provider: PaymentProvider,
    event: PaymentWebhookEvent
  ): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;

    try {
      const paymentData = await paymentProvider.handlePaymentSuccess(event);

      // 查找订单
      const orderId = paymentData.metadata?.orderId;
      if (!orderId) {
        throw new PaymentError('Order ID not found in payment metadata', 'MISSING_ORDER_ID');
      }

      const order = await db('orders').where('id', orderId).first();
      if (!order) {
        throw new PaymentError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND');
      }

      // 检查订单状态转换
      if (!canTransitionOrderStatus(order.status as OrderStatus, 'paid')) {
        logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to paid`);
        return;
      }

      const now = new Date();
      const startDate = now;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (order.duration_days || 30));

      // 更新订单状态
      await db('orders')
        .where('id', order.id)
        .update({
          status: 'paid',
          payment_time: now,
          start_date: startDate,
          end_date: endDate,
          updated_at: now,
        });

      // 记录状态变更
      await db('order_status_logs').insert({
        order_id: order.id,
        from_status: order.status,
        to_status: 'paid',
        changed_by: 'system',
        reason: `Payment received via ${provider}`,
      });

      // 更新用户流量限制和过期日期
      if (order.traffic_limit) {
        await db('users')
          .where('user_id', order.user_id)
          .update({
            traffic_limit: db.raw('traffic_limit + ?', [order.traffic_limit]),
            expire_date: endDate,
            updated_at: now,
          });
      }

      // 记录支付成功日志
      PaymentLogger.logPaymentSuccess(
        provider,
        order.order_no,
        paymentData.providerOrderId,
        paymentData.amount,
        paymentData.currency,
        order.user_id
      );
      
      logger.info(`Payment success processed for order: ${order.order_no} via ${provider}`);
    } catch (error) {
      logger.error(`Failed to process payment success via ${provider}:`, error);
      throw new PaymentError(
        `Failed to process payment success: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PAYMENT_SUCCESS_PROCESSING_FAILED',
        provider
      );
    }
  }

  /**
   * 处理支付失败
   */
  public async processPaymentFailure(
    provider: PaymentProvider,
    event: PaymentWebhookEvent
  ): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;

    try {
      const failureData = await paymentProvider.handlePaymentFailure(event);

      // 查找订单
      const order = await db('orders')
        .where('payment_id', failureData.providerOrderId)
        .first();

      if (!order) {
        // 记录支付失败日志
        PaymentLogger.logPaymentFailure(
          provider,
          '',
          failureData.reason || 'Payment failed',
          ''
        );
        
        logger.warn(`Order not found for failed payment: ${failureData.providerOrderId}`);
        return;
      }

      // 记录支付失败日志
      PaymentLogger.logPaymentFailure(
        provider,
        order.order_no,
        failureData.reason || 'Payment failed',
        order.user_id
      );

      // 检查订单状态转换
      if (!canTransitionOrderStatus(order.status as OrderStatus, 'cancelled')) {
        logger.warn(`Order ${order.order_no} cannot transition from ${order.status} to cancelled`);
        return;
      }

      // 更新订单状态
      await db('orders')
        .where('id', order.id)
        .update({
          status: 'cancelled',
          updated_at: new Date(),
        });

      // 记录状态变更
      await db('order_status_logs').insert({
        order_id: order.id,
        from_status: order.status,
        to_status: 'cancelled',
        changed_by: 'system',
        reason: `Payment failed: ${failureData.reason || 'Unknown reason'}`,
      });

      logger.info(`Payment failure processed for order: ${order.order_no} via ${provider}`);
    } catch (error) {
      logger.error(`Failed to process payment failure via ${provider}:`, error);
      throw new PaymentError(
        `Failed to process payment failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PAYMENT_FAILURE_PROCESSING_FAILED',
        provider
      );
    }
  }

  /**
   * 处理退款
   */
  public async processRefund(
    orderId: string,
    amount?: number,
    reason?: string,
    changedBy: string = 'system'
  ): Promise<RefundResponse> {
    // 查找订单
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new PaymentError(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND');
    }

    // 检查订单状态
    if (order.status !== 'paid' && order.status !== 'completed') {
      throw new PaymentError(`Order cannot be refunded. Current status: ${order.status}`, 'INVALID_ORDER_STATUS');
    }

    if (!order.payment_method || !order.payment_id) {
      throw new PaymentError('Order does not have payment information', 'MISSING_PAYMENT_INFO');
    }

    const provider = order.payment_method as PaymentProvider;
    
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;

    try {
      // 处理退款
      const refundRequest: RefundRequest = {
        paymentId: order.payment_id,
        amount,
        reason,
      };

      const refundResult = await paymentProvider.processRefund(refundRequest);

      if (refundResult.success) {
        const now = new Date();

        // 更新订单状态
        await db('orders')
          .where('id', order.id)
          .update({
            status: 'refunded',
            updated_at: now,
          });

        // 记录状态变更
        await db('order_status_logs').insert({
          order_id: order.id,
          from_status: order.status,
          to_status: 'refunded',
          changed_by: changedBy,
          reason: reason || 'Order refunded',
        });

        // 扣除用户流量限制
        if (order.traffic_limit) {
          await db('users')
            .where('user_id', order.user_id)
            .update({
              traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
              updated_at: now,
            });
        }

        logger.info(`Refund processed for order: ${order.order_no} by ${changedBy} via ${provider}`);
      }

      return refundResult;
    } catch (error) {
      logger.error(`Failed to process refund via ${provider}:`, error);
      throw new PaymentError(
        `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REFUND_PROCESSING_FAILED',
        provider
      );
    }
  }

  /**
   * 获取支付状态
   */
  public async getPaymentStatus(
    provider: PaymentProvider,
    paymentId: string
  ): Promise<PaymentStatusResponse> {
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;

    try {
      const status = await paymentProvider.getPaymentStatus(paymentId);
      logger.info(`Retrieved payment status for ${paymentId} via ${provider}: ${status.status}`);
      return status;
    } catch (error) {
      logger.error(`Failed to get payment status via ${provider}:`, error);
      throw new PaymentError(
        `Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PAYMENT_STATUS_RETRIEVAL_FAILED',
        provider
      );
    }
  }

  /**
   * 验证支付请求
   */
  private validateCreatePaymentRequest(request: CreatePaymentRequest): void {
    if (!request.orderId) {
      throw new PaymentError('Order ID is required', 'MISSING_ORDER_ID');
    }

    if (!request.amount || request.amount <= 0) {
      throw new PaymentError('Amount must be greater than 0', 'INVALID_AMOUNT');
    }

    if (!request.currency) {
      throw new PaymentError('Currency is required', 'MISSING_CURRENCY');
    }

    if (!request.description) {
      throw new PaymentError('Description is required', 'MISSING_DESCRIPTION');
    }
  }

  /**
   * 检查是否为二维码支付
   */
  public isQRCodePayment(provider: PaymentProvider): boolean {
    return isQRCodePayment(provider);
  }

  /**
   * 获取二维码信息
   */
  public getQRCodeInfo(provider: PaymentProvider) {
    return getQRCodeInfo(provider);
  }

  /**
   * 验证 webhook 签名
   */
  public verifyWebhookSignature(
    provider: PaymentProvider,
    payload: string,
    signature: string
  ): boolean {
    if (!this.providers.has(provider)) {
      logger.warn(`Provider ${provider} is not available for signature verification`);
      return false;
    }

    try {
      const paymentProvider = this.providers.get(provider)!;
      const secret = this.getWebhookSecret(provider);
      return paymentProvider.verifyWebhookSignature(payload, signature, secret);
    } catch (error) {
      logger.error(`Webhook signature verification failed for ${provider}:`, error);
      return false;
    }
  }

  /**
   * 解析 webhook 事件
   */
  public parseWebhookEvent(
    provider: PaymentProvider,
    rawBody: string,
    signature: string
  ): PaymentWebhookEvent {
    if (!this.providers.has(provider)) {
      throw new PaymentError(`Provider ${provider} is not available`, 'PROVIDER_NOT_AVAILABLE');
    }

    const paymentProvider = this.providers.get(provider)!;
    return paymentProvider.parseWebhookEvent(rawBody, signature);
  }

  /**
   * 获取 webhook 密钥
   */
  private getWebhookSecret(provider: PaymentProvider): string {
    const { config: appConfig } = require('../../config');

    switch (provider) {
      case 'stripe':
        return appConfig.payment?.stripe?.webhookSecret || '';
      case 'paypal':
        return appConfig.payment?.paypal?.webhookSecret || '';
      case 'alipay_merchant':
        return appConfig.payment?.alipayMerchant?.alipayPublicKey || '';
      case 'wechat_merchant':
        return appConfig.payment?.wechatMerchant?.apiKey || '';
      default:
        return '';
    }
  }
}

/**
 * 导出支付聚合器实例
 */
export let paymentAggregator: PaymentAggregator;

/**
 * 初始化支付聚合器
 */
export function initializePaymentAggregator(): void {
  paymentAggregator = PaymentAggregator.getInstance();
}
