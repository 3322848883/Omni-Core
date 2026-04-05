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
     * 发送密码重置邮件
     * @param email - 用户邮箱
     * @param resetToken - 重置令牌
     * @param resetUrl - 重置密码页面URL
     */
    sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean>;
    /**
     * 检查邮件服务是否已配置
     */
    isEmailConfigured(): boolean;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map