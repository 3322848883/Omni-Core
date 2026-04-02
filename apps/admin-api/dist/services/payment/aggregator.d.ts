import { PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundResponse, PaymentStatusResponse } from './types';
/**
 * 支付聚合器核心类
 * 提供统一的支付处理能力，管理多个支付渠道
 */
export declare class PaymentAggregator {
    private static instance;
    private providers;
    private constructor();
    /**
     * 获取支付聚合器实例（单例模式）
     */
    static getInstance(): PaymentAggregator;
    /**
     * 初始化支付提供商
     */
    private initializeProviders;
    /**
     * 获取所有可用的支付提供商
     */
    getAvailableProviders(): PaymentProvider[];
    /**
     * 根据订单金额和货币选择最合适的支付提供商
     */
    selectProvider(amount: number, currency: string): PaymentProvider;
    /**
     * 创建支付
     */
    createPayment(provider: PaymentProvider, request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * 处理支付成功
     */
    processPaymentSuccess(provider: PaymentProvider, event: PaymentWebhookEvent): Promise<void>;
    /**
     * 处理支付失败
     */
    processPaymentFailure(provider: PaymentProvider, event: PaymentWebhookEvent): Promise<void>;
    /**
     * 处理退款
     */
    processRefund(orderId: string, amount?: number, reason?: string, changedBy?: string): Promise<RefundResponse>;
    /**
     * 获取支付状态
     */
    getPaymentStatus(provider: PaymentProvider, paymentId: string): Promise<PaymentStatusResponse>;
    /**
     * 验证支付请求
     */
    private validateCreatePaymentRequest;
    /**
     * 检查是否为二维码支付
     */
    isQRCodePayment(provider: PaymentProvider): boolean;
    /**
     * 获取二维码信息
     */
    getQRCodeInfo(provider: PaymentProvider): {
        qrCodeUrl: string;
        receiverName: string;
        instructions: string;
    } | null;
    /**
     * 验证 webhook 签名
     */
    verifyWebhookSignature(provider: PaymentProvider, payload: string, signature: string): boolean;
    /**
     * 解析 webhook 事件
     */
    parseWebhookEvent(provider: PaymentProvider, rawBody: string, signature: string): PaymentWebhookEvent;
    /**
     * 获取 webhook 密钥
     */
    private getWebhookSecret;
}
/**
 * 导出支付聚合器实例
 */
export declare let paymentAggregator: PaymentAggregator;
/**
 * 初始化支付聚合器
 */
export declare function initializePaymentAggregator(): void;
//# sourceMappingURL=aggregator.d.ts.map