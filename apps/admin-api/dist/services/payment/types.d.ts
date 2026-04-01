export type PaymentProvider = 'stripe' | 'paypal' | 'alipay' | 'wechat' | 'alipay_merchant' | 'wechat_merchant';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
/**
 * 支付错误类
 */
export declare class PaymentError extends Error {
    readonly code: string;
    readonly provider?: PaymentProvider | undefined;
    constructor(message: string, code: string, provider?: PaymentProvider | undefined);
}
/**
 * 验证支付提供商字符串
 */
export declare function isValidPaymentProvider(provider: string): provider is PaymentProvider;
/**
 * 验证支付状态字符串
 */
export declare function isValidPaymentStatus(status: string): status is PaymentStatus;
export interface PaymentOrder {
    id: string;
    orderNo: string;
    userId: string;
    amount: number;
    currency: string;
    description: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    providerOrderId?: string;
    clientSecret?: string;
    checkoutUrl?: string;
    metadata?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreatePaymentRequest {
    orderId: string;
    orderNo: string;
    userId: string;
    amount: number;
    currency: string;
    description: string;
    returnUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
}
export interface CreatePaymentResponse {
    success: boolean;
    provider: PaymentProvider;
    orderId: string;
    clientSecret?: string;
    checkoutUrl?: string;
    paymentIntentId?: string;
}
export interface PaymentWebhookEvent {
    id: string;
    type: string;
    provider: PaymentProvider;
    data: unknown;
    signature?: string;
    rawBody: string;
}
/**
 * 类型守卫：验证对象是否为有效的 PaymentWebhookEvent
 */
export declare function isValidWebhookEvent(event: unknown): event is PaymentWebhookEvent;
/**
 * 验证并解析金额
 * @param value - 要验证的值
 * @param fieldName - 字段名称（用于错误消息）
 * @returns 解析后的金额
 */
export declare function validateAmount(value: unknown, fieldName?: string): number;
/**
 * 验证并解析货币代码
 * @param value - 要验证的值
 * @returns 标准化后的货币代码
 */
export declare function validateCurrency(value: unknown): string;
/**
 * 验证字符串字段
 * @param value - 要验证的值
 * @param fieldName - 字段名称
 * @param options - 验证选项
 */
export declare function validateString(value: unknown, fieldName: string, options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
}): string | undefined;
/**
 * 安全地访问嵌套对象属性
 * @param obj - 对象
 * @param path - 属性路径（如 'data.amount.value'）
 * @returns 属性值或 undefined
 */
export declare function getNestedValue<T = unknown>(obj: unknown, path: string): T | undefined;
export interface RefundRequest {
    paymentId: string;
    amount?: number;
    reason?: string;
}
export interface RefundResponse {
    success: boolean;
    refundId: string;
    amount: number;
    status: string;
}
export interface PaymentStatusResponse {
    orderId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt?: Date;
    providerOrderId?: string;
}
export interface IPaymentProvider {
    readonly name: PaymentProvider;
    /**
     * Create a payment session/intent
     */
    createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Parse webhook event
     */
    parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent;
    /**
     * Handle payment success webhook
     */
    handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
    }>;
    /**
     * Handle payment failure webhook
     */
    handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        reason?: string;
    }>;
    /**
     * Handle refund webhook
     */
    handleRefund(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        refundId: string;
        amount: number;
        status: string;
    }>;
    /**
     * Process refund
     */
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    /**
     * Get payment status
     */
    getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
}
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded' | 'expired';
export interface OrderStatusTransition {
    from: OrderStatus | null;
    to: OrderStatus;
    allowed: boolean;
    requiresAction?: boolean;
}
export declare const ORDER_STATUS_TRANSITIONS: OrderStatusTransition[];
export declare function canTransitionOrderStatus(fromStatus: OrderStatus | null, toStatus: OrderStatus): boolean;
//# sourceMappingURL=types.d.ts.map