import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundRequest, RefundResponse, PaymentStatusResponse } from './types';
export declare class StripePaymentProvider implements IPaymentProvider {
    readonly name: PaymentProvider;
    private client;
    constructor();
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
}
//# sourceMappingURL=stripe.d.ts.map