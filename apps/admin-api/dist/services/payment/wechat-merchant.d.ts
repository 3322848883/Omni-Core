import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundRequest, RefundResponse, PaymentStatusResponse } from './types';
/**
 * 微信商家收款码支付提供商
 *
 * 实现原理：
 * 1. 商家通过微信支付商户平台获取 mchid、appid 和 API 密钥
 * 2. 用户下单后，系统调用微信支付 Native 支付接口生成二维码
 * 3. 返回支付二维码给用户扫码支付
 * 4. 用户完成支付后，微信通过 webhook 通知系统
 * 5. 系统自动确认收款并开通服务
 *
 * 优势：
 * - 自动回调确认，无需人工干预
 * - 支持退款接口
 * - 支持 Native 支付（扫码支付）
 * - 更专业的支付体验
 */
export declare class WechatMerchantProvider implements IPaymentProvider {
    readonly name: PaymentProvider;
    private mchId;
    private appId;
    private apiKey;
    private sandbox;
    private gatewayUrl;
    constructor();
    /**
     * 创建支付
     * 调用微信支付 Native 支付接口生成二维码
     */
    createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * 生成随机字符串
     */
    private generateNonceStr;
    /**
     * 生成微信支付签名
     */
    private generateSign;
    /**
     * 构建 XML 请求体
     */
    private buildXmlBody;
    /**
     * 解析 XML 响应
     */
    private parseXmlResponse;
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
//# sourceMappingURL=wechat-merchant.d.ts.map