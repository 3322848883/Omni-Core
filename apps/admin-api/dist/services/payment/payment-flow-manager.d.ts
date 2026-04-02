import { PaymentProvider, PaymentStatus, CreatePaymentRequest, CreatePaymentResponse, RefundResponse, PaymentStatusResponse } from './types';
type IdempotencyKey = string;
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
export interface FailureReason {
    code: string;
    message: string;
    timestamp: Date;
}
export declare class PaymentFlowManager {
    private static instance;
    private retryConfig;
    private inProgressPayments;
    private constructor();
    static getInstance(): PaymentFlowManager;
    /**
     * 生成幂等性键
     */
    generateIdempotencyKey(orderId: string, provider: PaymentProvider): IdempotencyKey;
    /**
     * 创建支付流程
     */
    createPaymentFlow(provider: PaymentProvider, request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * 执行支付创建
     */
    private executePaymentCreation;
    /**
     * 处理支付失败
     */
    private handlePaymentFailure;
    /**
     * 重试支付
     */
    private retryPayment;
    /**
     * 计算下一次尝试时间
     */
    private calculateNextAttemptTime;
    /**
     * 计算延迟时间
     */
    private calculateDelayMs;
    /**
     * 查询支付状态
     */
    getPaymentStatus(provider: PaymentProvider, paymentId: string): Promise<PaymentStatusResponse>;
    /**
     * 处理退款
     */
    processRefund(orderId: string, amount?: number, reason?: string, changedBy?: string): Promise<RefundResponse>;
    /**
     * 处理支付成功
     */
    processPaymentSuccess(provider: PaymentProvider, orderId: string, providerOrderId: string, amount: number, currency: string): Promise<void>;
    /**
     * 处理支付失败
     */
    processPaymentFailure(provider: PaymentProvider, orderId: string, reason?: string): Promise<void>;
    /**
     * 创建支付流程记录
     */
    private createPaymentFlowRecord;
    /**
     * 更新支付流程记录
     */
    private updatePaymentFlowRecord;
    /**
     * 更新支付流程状态
     */
    private updatePaymentFlowStatus;
    /**
     * 增加尝试次数
     */
    private incrementAttempts;
    /**
     * 根据ID获取支付流程
     */
    private getPaymentFlowById;
    /**
     * 根据订单ID获取支付流程
     */
    private getPaymentFlowByOrderId;
    /**
     * 获取待处理的支付流程
     */
    getPendingPaymentFlows(): Promise<PaymentFlowState[]>;
    /**
     * 清理过期的支付流程
     */
    cleanupExpiredFlows(): Promise<void>;
}
export declare let paymentFlowManager: PaymentFlowManager;
/**
 * 初始化支付流程管理器
 */
export declare function initializePaymentFlowManager(): void;
export {};
//# sourceMappingURL=payment-flow-manager.d.ts.map