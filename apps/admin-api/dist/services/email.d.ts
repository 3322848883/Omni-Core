interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}
/**
 * 邮件服务
 * 用于发送系统通知邮件
 */
declare class EmailService {
    private transporter;
    private isConfigured;
    constructor();
    /**
     * 初始化邮件传输器
     */
    private initializeTransporter;
    /**
     * 发送邮件
     */
    sendEmail(options: EmailOptions): Promise<boolean>;
    /**
     * 发送个人收款码支付通知邮件
     * 当用户选择个人收款码支付时，通知管理员
     */
    sendQRPaymentNotification(params: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: 'alipay' | 'wechat';
        paymentTime: Date;
    }): Promise<boolean>;
    /**
     * 发送支付成功通知邮件
     * 当用户成功支付时，通知管理员
     */
    sendPaymentSuccessNotification(params: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentTime: Date;
        requiresManualConfirmation?: boolean;
    }): Promise<boolean>;
    /**
     * 检查邮件服务是否已配置
     */
    isEmailConfigured(): boolean;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.d.ts.map