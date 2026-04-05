import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundRequest, RefundResponse, PaymentStatusResponse } from './types';
export declare class PayPalPaymentProvider implements IPaymentProvider {
    readonly name: PaymentProvider;
    private client;
    private accessToken;
    private tokenExpiry;
    constructor();
    private getAccessToken;
    createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
    parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent;
    handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
    }>;
    handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        reason?: string;
    }>;
    handleRefund(event: PaymentWebhookEvent): Promise<{
        providerOrderId: string;
        refundId: string;
        amount: number;
        status: string;
    }>;
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
    /**
     * Capture an approved PayPal order
     * This should be called after user approves the payment
     */
    captureOrder(orderId: string): Promise<{
        id: string;
        status: string;
        amount: number;
        currency: string;
    }>;
}
//# sourceMappingURL=paypal.d.ts.map