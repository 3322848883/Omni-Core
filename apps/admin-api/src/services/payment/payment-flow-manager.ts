import { logger } from '../../utils/logger';
import { db } from '../../database';
import { getPaymentProvider, getAvailableProviders } from './index';
import {
  PaymentProvider,
  PaymentStatus,
  OrderStatus,
  CreatePaymentRequest,
  CreatePaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  canTransitionOrderStatus,
  PaymentError,
  validateAmount,
  validateString,
  validateCurrency
} from './types';

// 重试配置
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// 幂等性键类型
type IdempotencyKey = string;

// 支付流程状态
export interface PaymentFlowState {
  id: string;
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerOrderId?: string;
  status: PaymentStatus;
  attempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  idempotencyKey: IdempotencyKey;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// 失败原因类型
export interface FailureReason {
  code: string;
  message: string;
  timestamp: Date;
}

// 支付流程管理器
export class PaymentFlowManager {
  private static instance: PaymentFlowManager;
  private retryConfig: RetryConfig;
  private inProgressPayments: Set<string> = new Set();

  private constructor() {
    this.retryConfig = {
      maxAttempts: 5,
      delayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2
    };
  }

  static getInstance(): PaymentFlowManager {
    if (!PaymentFlowManager.instance) {
      PaymentFlowManager.instance = new PaymentFlowManager();
    }
    return PaymentFlowManager.instance;
  }

  /**
   * 生成幂等性键
   */
  generateIdempotencyKey(orderId: string, provider: PaymentProvider): IdempotencyKey {
    return `${provider}_${orderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建支付流程
   */
  async createPaymentFlow(
    provider: PaymentProvider,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    // 验证输入
    validateString(request.orderId, 'orderId');
    validateString(request.orderNo, 'orderNo');
    validateString(request.userId, 'userId');
    validateAmount(request.amount, 'amount');
    validateCurrency(request.currency);

    // 生成幂等性键
    const idempotencyKey = this.generateIdempotencyKey(request.orderId, provider);

    // 检查是否已存在相同的支付流程
    const existingFlow = await this.getPaymentFlowByOrderId(request.orderId);
    if (existingFlow) {
      // 如果已存在，返回现有的支付信息
      return {
        success: true,
        provider: existingFlow.provider,
        orderId: existingFlow.orderId,
        clientSecret: existingFlow.metadata?.clientSecret,
        checkoutUrl: existingFlow.metadata?.checkoutUrl,
        paymentIntentId: existingFlow.providerOrderId
      };
    }

    // 创建支付流程记录
    const flowId = await this.createPaymentFlowRecord({
      orderId: request.orderId,
      orderNo: request.orderNo,
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      provider,
      status: 'pending',
      attempts: 0,
      idempotencyKey,
      metadata: request.metadata
    });

    // 执行支付创建
    return this.executePaymentCreation(flowId, provider, request);
  }

  /**
   * 执行支付创建
   */
  private async executePaymentCreation(
    flowId: string,
    provider: PaymentProvider,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    try {
      // 标记为处理中
      this.inProgressPayments.add(flowId);

      // 更新状态为处理中
      await this.updatePaymentFlowStatus(flowId, 'processing');

      // 增加尝试次数
      await this.incrementAttempts(flowId);

      // 获取支付提供商
      const paymentProvider = getPaymentProvider(provider);

      // 创建支付
      const response = await paymentProvider.createPayment(request);

      // 更新支付流程记录
      await this.updatePaymentFlowRecord(flowId, {
        status: 'pending',
        providerOrderId: response.paymentIntentId,
        metadata: {
          ...request.metadata,
          clientSecret: response.clientSecret || '',
          checkoutUrl: response.checkoutUrl || ''
        }
      });

      return response;
    } catch (error) {
      // 处理错误
      await this.handlePaymentFailure(flowId, error as Error);
      throw error;
    } finally {
      // 移除处理中标记
      this.inProgressPayments.delete(flowId);
    }
  }

  /**
   * 处理支付失败
   */
  private async handlePaymentFailure(flowId: string, error: Error): Promise<void> {
    const flow = await this.getPaymentFlowById(flowId);
    if (!flow) return;

    // 计算下一次尝试时间
    const nextAttemptAt = this.calculateNextAttemptTime(flow.attempts);

    // 更新失败信息
    await this.updatePaymentFlowRecord(flowId, {
      status: 'failed',
      nextAttemptAt,
      metadata: {
        ...flow.metadata,
        lastError: JSON.stringify({
          code: error instanceof PaymentError ? error.code : 'UNKNOWN_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        })
      }
    });

    // 如果还有尝试次数，安排重试
    if (flow.attempts < this.retryConfig.maxAttempts) {
      setTimeout(() => {
        this.retryPayment(flowId).catch(err => {
          logger.error(`Failed to retry payment ${flowId}:`, err);
        });
      }, this.calculateDelayMs(flow.attempts));
    }
  }

  /**
   * 重试支付
   */
  private async retryPayment(flowId: string): Promise<void> {
    const flow = await this.getPaymentFlowById(flowId);
    if (!flow) return;

    // 检查是否超过最大尝试次数
    if (flow.attempts >= this.retryConfig.maxAttempts) {
      logger.warn(`Payment ${flowId} has reached maximum retry attempts`);
      return;
    }

    // 检查是否正在处理中
    if (this.inProgressPayments.has(flowId)) {
      logger.warn(`Payment ${flowId} is already in progress`);
      return;
    }

    try {
      // 重新执行支付创建
      const request: CreatePaymentRequest = {
        orderId: flow.orderId,
        orderNo: flow.orderNo,
        userId: flow.userId,
        amount: flow.amount,
        currency: flow.currency,
        description: flow.metadata?.description || `Payment for order ${flow.orderNo}`,
        returnUrl: flow.metadata?.returnUrl,
        cancelUrl: flow.metadata?.cancelUrl,
        metadata: flow.metadata
      };

      await this.executePaymentCreation(flowId, flow.provider, request);
    } catch (error) {
      logger.error(`Retry failed for payment ${flowId}:`, error);
    }
  }

  /**
   * 计算下一次尝试时间
   */
  private calculateNextAttemptTime(attempts: number): Date {
    const delayMs = this.calculateDelayMs(attempts);
    return new Date(Date.now() + delayMs);
  }

  /**
   * 计算延迟时间
   */
  private calculateDelayMs(attempts: number): number {
    const delay = this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffMultiplier, attempts);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(
    provider: PaymentProvider,
    paymentId: string
  ): Promise<PaymentStatusResponse> {
    const paymentProvider = getPaymentProvider(provider);
    return paymentProvider.getPaymentStatus(paymentId);
  }

  /**
   * 处理退款
   */
  async processRefund(
    orderId: string,
    amount?: number,
    reason?: string,
    changedBy: string = 'system'
  ): Promise<RefundResponse> {
    // 验证输入
    validateString(orderId, 'orderId');
    if (amount !== undefined) {
      validateAmount(amount, 'amount');
    }

    // 获取订单信息
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new PaymentError('Order not found', 'ORDER_NOT_FOUND');
    }

    // 检查是否可以退款
    if (!canTransitionOrderStatus(order.status as OrderStatus, 'refunded')) {
      throw new PaymentError(
        `Order cannot be refunded. Current status: ${order.status}`,
        'INVALID_STATUS'
      );
    }

    // 获取支付提供商
    const provider = order.payment_provider as PaymentProvider;
    const paymentProvider = getPaymentProvider(provider);

    // 创建退款请求
    const refundRequest: RefundRequest = {
      paymentId: order.payment_id || '',
      amount: amount || order.amount,
      reason: reason || 'Refund requested'
    };

    // 执行退款
    const refundResponse = await paymentProvider.processRefund(refundRequest);

    // 更新订单状态
    const now = new Date();
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'refunded',
        updated_at: now
      });

    // 记录状态变更
    await db('order_status_logs').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: 'refunded',
      changed_by: changedBy,
      reason: `Refund processed: ${refundResponse.refundId}`
    });

    // 处理流量限制退款
    if (order.traffic_limit) {
      await db('users')
        .where('user_id', order.user_id)
        .update({
          traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
          updated_at: now
        });
    }

    return refundResponse;
  }

  /**
   * 处理支付成功
   */
  async processPaymentSuccess(
    provider: PaymentProvider,
    orderId: string,
    providerOrderId: string,
    amount: number,
    currency: string
  ): Promise<void> {
    // 获取订单
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new PaymentError('Order not found', 'ORDER_NOT_FOUND');
    }

    // 检查状态转换
    if (!canTransitionOrderStatus(order.status as OrderStatus, 'paid')) {
      throw new PaymentError(
        `Order cannot be marked as paid. Current status: ${order.status}`,
        'INVALID_STATUS'
      );
    }

    // 更新订单状态
    const now = new Date();
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'paid',
        payment_id: providerOrderId,
        payment_provider: provider,
        updated_at: now
      });

    // 记录状态变更
    await db('order_status_logs').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: 'paid',
      changed_by: 'system',
      reason: 'Payment completed successfully'
    });

    // 更新支付流程状态
    const flow = await this.getPaymentFlowByOrderId(orderId);
    if (flow) {
      await this.updatePaymentFlowStatus(flow.id, 'paid');
    }
  }

  /**
   * 处理支付失败
   */
  async processPaymentFailure(
    provider: PaymentProvider,
    orderId: string,
    reason?: string
  ): Promise<void> {
    // 获取订单
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new PaymentError('Order not found', 'ORDER_NOT_FOUND');
    }

    // 检查状态转换
    if (!canTransitionOrderStatus(order.status as OrderStatus, 'cancelled')) {
      throw new PaymentError(
        `Order cannot be marked as cancelled. Current status: ${order.status}`,
        'INVALID_STATUS'
      );
    }

    // 更新订单状态
    const now = new Date();
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'cancelled',
        updated_at: now
      });

    // 记录状态变更
    await db('order_status_logs').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: 'cancelled',
      changed_by: 'system',
      reason: `Payment failed: ${reason || 'Unknown error'}`
    });

    // 更新支付流程状态
    const flow = await this.getPaymentFlowByOrderId(orderId);
    if (flow) {
      await this.updatePaymentFlowStatus(flow.id, 'failed');
    }
  }

  // 数据库操作方法

  /**
   * 创建支付流程记录
   */
  private async createPaymentFlowRecord(data: Partial<PaymentFlowState>): Promise<string> {
    const now = new Date();
    const [id] = await db('payment_flows').insert({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return id.toString();
  }

  /**
   * 更新支付流程记录
   */
  private async updatePaymentFlowRecord(
    id: string,
    data: Partial<PaymentFlowState>
  ): Promise<void> {
    await db('payment_flows')
      .where('id', id)
      .update({
        ...data,
        updatedAt: new Date()
      });
  }

  /**
   * 更新支付流程状态
   */
  private async updatePaymentFlowStatus(id: string, status: PaymentStatus): Promise<void> {
    await this.updatePaymentFlowRecord(id, { status });
  }

  /**
   * 增加尝试次数
   */
  private async incrementAttempts(id: string): Promise<void> {
    await db('payment_flows')
      .where('id', id)
      .update({
        attempts: db.raw('attempts + 1'),
        lastAttemptAt: new Date(),
        updatedAt: new Date()
      });
  }

  /**
   * 根据ID获取支付流程
   */
  private async getPaymentFlowById(id: string): Promise<PaymentFlowState | null> {
    return db('payment_flows').where('id', id).first();
  }

  /**
   * 根据订单ID获取支付流程
   */
  private async getPaymentFlowByOrderId(orderId: string): Promise<PaymentFlowState | null> {
    return db('payment_flows').where('orderId', orderId).first();
  }

  /**
   * 获取待处理的支付流程
   */
  async getPendingPaymentFlows(): Promise<PaymentFlowState[]> {
    return db('payment_flows')
      .where('status', 'in', ['pending', 'processing'])
      .where('nextAttemptAt', '<=', new Date())
      .where('attempts', '<', this.retryConfig.maxAttempts)
      .orderBy('createdAt', 'asc');
  }

  /**
   * 清理过期的支付流程
   */
  async cleanupExpiredFlows(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天前
    await db('payment_flows')
      .where('createdAt', '<', cutoffDate)
      .where('status', 'in', ['failed', 'cancelled', 'refunded'])
      .del();
  }
}

// 导出单例
export let paymentFlowManager: PaymentFlowManager;

/**
 * 初始化支付流程管理器
 */
export function initializePaymentFlowManager(): void {
  paymentFlowManager = PaymentFlowManager.getInstance();
}