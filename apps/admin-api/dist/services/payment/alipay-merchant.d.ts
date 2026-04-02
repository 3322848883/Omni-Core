import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundRequest, RefundResponse, PaymentStatusResponse } from './types';
/**
 * 支付宝商家收款码支付提供商
 *
 * 实现原理：
 * 1. 商家通过支付宝开放平台创建应用，获取 app_id 和私钥
 * 2. 用户下单后，系统调用支付宝接口生成预创建订单
 * 3. 返回支付链接或二维码给用户
 * 4. 用户完成支付后，支付宝通过 webhook 通知系统
 * 5. 系统自动确认收款并开通服务
 *
 * 优势：
 * - 自动回调确认，无需人工干预
 * - 支持退款接口
 * - 更专业的支付体验
 */
export declare class AlipayMerchantProvider implements IPaymentProvider {
    readonly name: PaymentProvider;
    private appId;
    private privateKey;
    private alipayPublicKey;
    private sandbox;
    private gatewayUrl;
    constructor();
    /**
     * 创建支付
     * 调用支付宝接口生成预创建订单
     */
    createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * 构建支付宝支付链接
     */
    private buildPaymentUrl;
    /**
     * 生成支付宝签名
     */
    private generateSign;
    /**
     * 验证 Webhook 签名
     */
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * 解析 Webhook 事件
     */
    parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent;
    /**
     * 处理支付成功
     */
    handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
    }>;
    /**
     * 处理支付失败
     */
    handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        reason?: string;
    }>;
    /**
     * 处理退款
     */
    handleRefund(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        refundId: string;
        amount: number;
        status: string;
    }>;
    /**
     * 处理退款请求
     */
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    /**
     * 获取支付状态
     */
    getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
    /**
     * 查询订单状态（主动查询）
     */
    queryOrderStatus(outTradeNo: string): Promise<{
        tradeNo: string;
        status: string;
        amount: number;
        paidAt?: Date;
    }>;
}
//# sourceMappingURL=alipay-merchant.d.ts.map