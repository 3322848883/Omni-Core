import { PaymentAggregator, paymentAggregator } from './aggregator';
import { PaymentFlowManager, paymentFlowManager } from './payment-flow-manager';
import { IPaymentProvider, PaymentProvider, CreatePaymentRequest, CreatePaymentResponse, PaymentWebhookEvent, RefundResponse, PaymentStatusResponse } from './types';
/**
 * Initialize payment providers
 */
export declare function initializePaymentProviders(): void;
/**
 * Get payment provider by name
 */
export declare function getPaymentProvider(provider: PaymentProvider): IPaymentProvider;
/**
 * Get available payment providers
 */
export declare function getAvailableProviders(): PaymentProvider[];
/**
 * Check if provider is a QR code based payment (manual confirmation required)
 */
export declare function isQRCodePayment(provider: PaymentProvider): boolean;
/**
 * Get QR code info for payment provider
 */
export declare function getQRCodeInfo(provider: PaymentProvider): {
    qrCodeUrl: string;
    receiverName: string;
    instructions: string;
} | null;
/**
 * Create a payment for an order
 */
export declare function createPayment(provider: PaymentProvider, request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
/**
 * Process payment success webhook
 */
export declare function processPaymentSuccess(provider: PaymentProvider, event: PaymentWebhookEvent): Promise<void>;
/**
 * Process payment failure webhook
 */
export declare function processPaymentFailure(provider: PaymentProvider, event: PaymentWebhookEvent): Promise<void>;
/**
 * Process refund webhook
 */
export declare function processRefundWebhook(provider: PaymentProvider, event: PaymentWebhookEvent): Promise<void>;
/**
 * Process refund request
 */
export declare function processRefund(orderId: string, amount?: number, reason?: string, changedBy?: string): Promise<RefundResponse>;
/**
 * Get payment status
 */
export declare function getPaymentStatus(provider: PaymentProvider, paymentId: string): Promise<PaymentStatusResponse>;
/**
 * Verify webhook signature
 */
export declare function verifyWebhookSignature(provider: PaymentProvider, payload: string, signature: string): boolean;
/**
 * Parse webhook event
 */
export declare function parseWebhookEvent(provider: PaymentProvider, rawBody: string, signature: string): PaymentWebhookEvent;
/**
 * Complete order (transition from paid to completed)
 */
export declare function completeOrder(orderId: string, changedBy?: string): Promise<void>;
export * from './types';
export { PaymentAggregator, paymentAggregator };
export { PaymentFlowManager, paymentFlowManager };
//# sourceMappingURL=index.d.ts.map