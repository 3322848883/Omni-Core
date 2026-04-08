export interface EmailTaskPayload {
    type: 'simple' | 'qr_payment' | 'payment_success';
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    qrPaymentParams?: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: 'alipay' | 'wechat';
        paymentTime: string;
    };
    paymentSuccessParams?: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentTime: string;
        requiresManualConfirmation?: boolean;
    };
}
export declare class EmailTaskHandler {
    handle(payload: EmailTaskPayload): Promise<void>;
    private handleSimpleEmail;
    private handleQRPaymentNotification;
    private handlePaymentSuccessNotification;
}
export declare const emailTaskHandler: EmailTaskHandler;
//# sourceMappingURL=email-handler.d.ts.map