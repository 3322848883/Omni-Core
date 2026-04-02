import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundRequest, RefundResponse, PaymentStatusResponse } from './types';
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
export declare class AlipayPaymentProvider implements IPaymentProvider {
    readonly name: PaymentProvider;
    private qrCodeUrl;
    private receiverName;
    constructor();
    /**
     * 创建支付
     * 返回收款码URL和转账信息
     */
    createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    /**
     * 验证 Webhook 签名
     * 个人收款码不支持自动回调，返回 false
     */
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * 解析 Webhook 事件
     * 个人收款码不支持 webhook
     */
    parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent;
    /**
     * 处理支付成功
     * 个人收款码需要手动确认
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
     * 个人收款码需要手动退款
     */
    handleRefund(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        refundId: string;
        amount: number;
        status: string;
    }>;
    /**
     * 处理退款请求
     * 个人收款码需要手动处理
     */
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    /**
     * 获取支付状态
     * 个人收款码需要查询订单状态
     */
    getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
    /**
     * 获取收款码信息
     */
    getQRCodeInfo(): {
        qrCodeUrl: string;
        receiverName: string;
        instructions: string;
    };
}
//# sourceMappingURL=alipay.d.ts.map