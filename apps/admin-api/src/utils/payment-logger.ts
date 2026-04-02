import { logger } from './logger';
import { PCIDSSUtil } from './pci-dss';
import { EncryptionUtil } from './encryption';

/**
 * 支付操作日志工具类
 * 用于记录详细的支付操作日志，确保安全审计和监控
 */
export class PaymentLogger {
  /**
   * 记录支付创建日志
   * @param provider 支付提供商
   * @param orderNo 订单号
   * @param amount 金额
   * @param currency 货币
   * @param userId 用户ID
   * @param metadata 元数据
   */
  static logPaymentCreate(
    provider: string,
    orderNo: string,
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): void {
    const sanitizedMetadata = PCIDSSUtil.sanitizeData(metadata);
    logger.info('Payment created', {
      action: 'payment.create',
      provider,
      orderNo,
      amount,
      currency,
      userId: EncryptionUtil.mask(userId),
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付成功日志
   * @param provider 支付提供商
   * @param orderNo 订单号
   * @param transactionId 交易ID
   * @param amount 金额
   * @param currency 货币
   * @param userId 用户ID
   */
  static logPaymentSuccess(
    provider: string,
    orderNo: string,
    transactionId: string,
    amount: number,
    currency: string,
    userId: string
  ): void {
    logger.info('Payment success', {
      action: 'payment.success',
      provider,
      orderNo,
      transactionId: EncryptionUtil.mask(transactionId),
      amount,
      currency,
      userId: EncryptionUtil.mask(userId),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付失败日志
   * @param provider 支付提供商
   * @param orderNo 订单号
   * @param reason 失败原因
   * @param userId 用户ID
   */
  static logPaymentFailure(
    provider: string,
    orderNo: string,
    reason: string,
    userId: string
  ): void {
    logger.warn('Payment failed', {
      action: 'payment.failure',
      provider,
      orderNo,
      reason,
      userId: EncryptionUtil.mask(userId),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录退款处理日志
   * @param provider 支付提供商
   * @param orderNo 订单号
   * @param refundId 退款ID
   * @param amount 退款金额
   * @param currency 货币
   * @param userId 用户ID
   */
  static logRefund(
    provider: string,
    orderNo: string,
    refundId: string,
    amount: number,
    currency: string,
    userId: string
  ): void {
    logger.info('Refund processed', {
      action: 'payment.refund',
      provider,
      orderNo,
      refundId: EncryptionUtil.mask(refundId),
      amount,
      currency,
      userId: EncryptionUtil.mask(userId),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付状态查询日志
   * @param provider 支付提供商
   * @param paymentId 支付ID
   * @param status 支付状态
   */
  static logPaymentStatus(
    provider: string,
    paymentId: string,
    status: string
  ): void {
    logger.debug('Payment status queried', {
      action: 'payment.status',
      provider,
      paymentId: EncryptionUtil.mask(paymentId),
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付异常日志
   * @param provider 支付提供商
   * @param orderNo 订单号
   * @param error 错误信息
   * @param context 上下文信息
   */
  static logPaymentError(
    provider: string,
    orderNo: string,
    error: Error,
    context?: Record<string, any>
  ): void {
    const sanitizedContext = PCIDSSUtil.sanitizeData(context);
    logger.error('Payment error', {
      action: 'payment.error',
      provider,
      orderNo,
      error: error.message,
      stack: error.stack,
      context: sanitizedContext,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付webhook事件日志
   * @param provider 支付提供商
   * @param eventType 事件类型
   * @param eventId 事件ID
   * @param transactionId 交易ID
   */
  static logWebhookEvent(
    provider: string,
    eventType: string,
    eventId: string,
    transactionId: string
  ): void {
    logger.info('Webhook event received', {
      action: 'payment.webhook',
      provider,
      eventType,
      eventId: EncryptionUtil.mask(eventId),
      transactionId: EncryptionUtil.mask(transactionId),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录支付配置变更日志
   * @param provider 支付提供商
   * @param changeType 变更类型
   * @param changedBy 变更人
   * @param details 变更详情
   */
  static logConfigChange(
    provider: string,
    changeType: string,
    changedBy: string,
    details?: Record<string, any>
  ): void {
    const sanitizedDetails = PCIDSSUtil.sanitizeData(details);
    logger.info('Payment config changed', {
      action: 'payment.config.change',
      provider,
      changeType,
      changedBy: EncryptionUtil.mask(changedBy),
      details: sanitizedDetails,
      timestamp: new Date().toISOString()
    });
  }
}