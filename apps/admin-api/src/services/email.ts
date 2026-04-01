import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

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
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  private initializeTransporter(): void {
    const { smtp } = config;

    if (!smtp.host || !smtp.user || !smtp.password) {
      logger.warn('Email service is not configured. SMTP settings are missing.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465, // 465端口使用SSL
        auth: {
          user: smtp.user,
          pass: smtp.password,
        },
      });

      this.isConfigured = true;
      logger.info(`Email service initialized with SMTP host: ${smtp.host}`);
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service is not configured. Cannot send email.');
      return false;
    }

    try {
      const { smtp } = config;
      
      const result = await this.transporter.sendMail({
        from: smtp.from || smtp.user,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent successfully. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * 发送个人收款码支付通知邮件
   * 当用户选择个人收款码支付时，通知管理员
   */
  async sendQRPaymentNotification(params: {
    adminEmail: string;
    orderNo: string;
    orderId: string;
    userEmail: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: 'alipay' | 'wechat';
    paymentTime: Date;
  }): Promise<boolean> {
    const methodName = params.paymentMethod === 'alipay' ? '支付宝' : '微信支付';
    const subject = `【新订单】用户已选择${methodName}个人收款码支付 - 订单号: ${params.orderNo}`;

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
    .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; color: #f5222d; font-weight: bold; }
    .notice { background: #fff7e6; border: 1px solid #ffd591; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .notice-title { color: #fa8c16; font-weight: bold; margin-bottom: 5px; }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🛎️ 新订单支付通知</h2>
    </div>
    <div class="content">
      <p>您好，有用户选择了<strong>${methodName}个人收款码</strong>进行支付，请查收。</p>
      
      <div class="info-row">
        <span class="label">订单号：</span>
        <span class="value">${params.orderNo}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付金额：</span>
        <span class="amount">${params.currency} ${params.amount.toFixed(2)}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付方式：</span>
        <span class="value">${methodName}个人收款码</span>
      </div>
      
      <div class="info-row">
        <span class="label">用户邮箱：</span>
        <span class="value">${params.userEmail}</span>
      </div>
      
      <div class="info-row">
        <span class="label">用户ID：</span>
        <span class="value">${params.userId}</span>
      </div>
      
      <div class="info-row">
        <span class="label">下单时间：</span>
        <span class="value">${params.paymentTime.toLocaleString('zh-CN')}</span>
      </div>

      <div class="notice">
        <div class="notice-title">⚠️ 重要提醒</div>
        <p>1. 请检查您的${methodName}账户是否收到对应金额的转账</p>
        <p>2. 请确认转账备注中是否包含订单号：<strong>${params.orderNo}</strong></p>
        <p>3. 确认收款后，请登录管理后台将订单标记为"已支付"</p>
        <p>4. 管理后台地址：<a href="${config.adminWebUrl}/orders">${config.adminWebUrl}/orders</a></p>
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
新订单支付通知

订单号：${params.orderNo}
支付金额：${params.currency} ${params.amount.toFixed(2)}
支付方式：${methodName}个人收款码
用户邮箱：${params.userEmail}
用户ID：${params.userId}
下单时间：${params.paymentTime.toLocaleString('zh-CN')}

重要提醒：
1. 请检查您的${methodName}账户是否收到对应金额的转账
2. 请确认转账备注中是否包含订单号：${params.orderNo}
3. 确认收款后，请登录管理后台将订单标记为"已支付"
4. 管理后台地址：${config.adminWebUrl}/orders

此邮件由 FGVPN 系统自动发送
    `;

    return this.sendEmail({
      to: params.adminEmail,
      subject,
      text,
      html,
    });
  }

  /**
   * 发送支付成功通知邮件
   * 当用户成功支付时，通知管理员
   */
  async sendPaymentSuccessNotification(params: {
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
  }): Promise<boolean> {
    // 支付方式名称映射
    const methodNames: Record<string, string> = {
      'stripe': 'Stripe (信用卡/借记卡)',
      'paypal': 'PayPal',
      'alipay': '支付宝个人收款码',
      'wechat': '微信个人收款码',
      'alipay_merchant': '支付宝商家支付',
      'wechat_merchant': '微信支付商家',
    };

    const methodName = methodNames[params.paymentMethod] || params.paymentMethod;
    const subject = `【支付成功】新订单支付完成 - 订单号: ${params.orderNo}`;

    // 根据支付方式确定是否需要手动确认
    const needsManualConfirmation = params.requiresManualConfirmation ?? 
      (params.paymentMethod === 'alipay' || params.paymentMethod === 'wechat');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #52c41a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
    .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; color: #f5222d; font-weight: bold; }
    .method { font-size: 18px; color: #1890ff; font-weight: bold; }
    .notice { background: #fff7e6; border: 1px solid #ffd591; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .notice-title { color: #fa8c16; font-weight: bold; margin-bottom: 5px; }
    .success-notice { background: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .success-title { color: #52c41a; font-weight: bold; margin-bottom: 5px; }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ 支付成功通知</h2>
    </div>
    <div class="content">
      <div class="success-notice">
        <div class="success-title">🎉 订单支付成功</div>
        <p>用户已完成支付，订单详情如下：</p>
      </div>
      
      <div class="info-row">
        <span class="label">订单号：</span>
        <span class="value">${params.orderNo}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付金额：</span>
        <span class="amount">${params.currency} ${params.amount.toFixed(2)}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付方式：</span>
        <span class="method">${methodName}</span>
      </div>
      
      <div class="info-row">
        <span class="label">用户邮箱：</span>
        <span class="value">${params.userEmail}</span>
      </div>
      
      <div class="info-row">
        <span class="label">用户ID：</span>
        <span class="value">${params.userId}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付时间：</span>
        <span class="value">${params.paymentTime.toLocaleString('zh-CN')}</span>
      </div>

      ${needsManualConfirmation ? `
      <div class="notice">
        <div class="notice-title">⚠️ 需要手动确认</div>
        <p>该订单使用${methodName}支付，需要您手动确认收款：</p>
        <p>1. 请检查您的${methodName.includes('支付宝') ? '支付宝' : '微信'}账户是否收到对应金额的转账</p>
        <p>2. 请确认转账备注中是否包含订单号：<strong>${params.orderNo}</strong></p>
        <p>3. 确认收款后，请登录管理后台将订单标记为"已支付"</p>
        <p>4. 管理后台地址：<a href="${config.adminWebUrl}/orders">${config.adminWebUrl}/orders</a></p>
      </div>
      ` : `
      <div class="success-notice">
        <div class="success-title">✓ 自动处理</div>
        <p>该订单已通过${methodName}自动完成支付，系统已自动开通用户服务。</p>
        <p>管理后台：<a href="${config.adminWebUrl}/orders">${config.adminWebUrl}/orders</a></p>
      </div>
      `}
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
支付成功通知

订单号：${params.orderNo}
支付金额：${params.currency} ${params.amount.toFixed(2)}
支付方式：${methodName}
用户邮箱：${params.userEmail}
用户ID：${params.userId}
支付时间：${params.paymentTime.toLocaleString('zh-CN')}

${needsManualConfirmation ? `
需要手动确认：
该订单使用${methodName}支付，需要您手动确认收款：
1. 请检查您的${methodName.includes('支付宝') ? '支付宝' : '微信'}账户是否收到对应金额的转账
2. 请确认转账备注中是否包含订单号：${params.orderNo}
3. 确认收款后，请登录管理后台将订单标记为"已支付"
4. 管理后台地址：${config.adminWebUrl}/orders
` : `
自动处理：
该订单已通过${methodName}自动完成支付，系统已自动开通用户服务。
管理后台：${config.adminWebUrl}/orders
`}

此邮件由 FGVPN 系统自动发送
    `;

    return this.sendEmail({
      to: params.adminEmail,
      subject,
      text,
      html,
    });
  }

  /**
   * 检查邮件服务是否已配置
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// 导出单例实例
export const emailService = new EmailService();
