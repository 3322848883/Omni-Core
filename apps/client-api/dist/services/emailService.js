"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("@/utils/logger"));
/**
 * 邮件服务
 * 用于发送系统通知邮件
 */
class EmailService {
    transporter = null;
    isConfigured = false;
    constructor() {
        this.initializeTransporter();
    }
    /**
     * 初始化邮件传输器
     */
    initializeTransporter() {
        // 检查 SMTP 配置
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPassword = process.env.SMTP_PASSWORD;
        const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
        if (!smtpHost || !smtpUser || !smtpPassword) {
            logger_1.default.warn('Email service is not configured. SMTP settings are missing.');
            this.isConfigured = false;
            return;
        }
        try {
            this.transporter = nodemailer_1.default.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465, // 465端口使用SSL
                auth: {
                    user: smtpUser,
                    pass: smtpPassword,
                },
            });
            this.isConfigured = true;
            logger_1.default.info(`Email service initialized with SMTP host: ${smtpHost}`);
        }
        catch (error) {
            logger_1.default.error('Failed to initialize email service:', error);
            this.isConfigured = false;
        }
    }
    /**
     * 发送邮件
     */
    async sendEmail(options) {
        if (!this.isConfigured || !this.transporter) {
            logger_1.default.warn('Email service is not configured. Cannot send email.');
            return false;
        }
        try {
            const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || '';
            const result = await this.transporter.sendMail({
                from: smtpFrom,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
            logger_1.default.info(`Email sent successfully. MessageId: ${result.messageId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to send email:', error);
            return false;
        }
    }
    /**
     * 发送密码重置邮件
     * @param email - 用户邮箱
     * @param resetToken - 重置令牌
     * @param resetUrl - 重置密码页面URL
     */
    async sendPasswordResetEmail(email, resetToken, resetUrl) {
        const subject = '【FGVPN】密码重置请求';
        const fullResetUrl = `${resetUrl}?token=${resetToken}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1890ff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 24px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .notice { background: #fff7e6; border: 1px solid #ffd591; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
    .token-box { background: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔐 密码重置请求</h2>
    </div>
    <div class="content">
      <p>您好，</p>
      <p>我们收到了您的密码重置请求。请点击下方按钮重置您的密码：</p>
      
      <div style="text-align: center;">
        <a href="${fullResetUrl}" class="button">重置密码</a>
      </div>
      
      <p>或者，您可以复制以下链接到浏览器地址栏：</p>
      <div class="token-box">${fullResetUrl}</div>
      
      <div class="notice">
        <strong>⚠️ 安全提示</strong>
        <p>此链接将在 <strong>1 小时</strong>后失效。</p>
        <p>如果您没有请求重置密码，请忽略此邮件，您的账户仍然安全。</p>
      </div>
    </div>
    <div class="footer">
      <p>此邮件由 FGVPN 系统自动发送</p>
      <p>${new Date().getFullYear()} FGVPN. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
        const text = `
密码重置请求

您好，

我们收到了您的密码重置请求。请访问以下链接重置您的密码：

${fullResetUrl}

安全提示：
- 此链接将在 1 小时后失效
- 如果您没有请求重置密码，请忽略此邮件，您的账户仍然安全

此邮件由 FGVPN 系统自动发送
${new Date().getFullYear()} FGVPN. All rights reserved.
    `;
        return this.sendEmail({
            to: email,
            subject,
            text,
            html,
        });
    }
    /**
     * 检查邮件服务是否已配置
     */
    isEmailConfigured() {
        return this.isConfigured;
    }
}
// 导出单例实例
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map