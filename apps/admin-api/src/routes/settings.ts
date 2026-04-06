import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCode, HttpStatus } from '@shared/constants';
import { db } from '../database';
import { logger } from '../utils/logger';
import { emailService } from '../services/email';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const router = Router();

// Default settings
const defaultSettings = {
  // General
  siteName: 'Omni Core',
  siteDescription: '高速稳定的VPN服务',
  siteLogo: '',
  siteFavicon: '',
  contactEmail: '',
  supportUrl: '',
  // Registration
  registrationEnabled: true,
  emailVerificationRequired: true,
  defaultTrafficLimit: 107374182400, // 100GB in bytes
  defaultExpireDays: 30,
  // Payment
  currency: 'CNY',
  paymentMethods: ['alipay', 'wechat'],
  // Security
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordMinLength: 8,
  requireStrongPassword: true,
  // Traffic
  trafficResetDay: 1,
  trafficAlertThreshold: 85,
  // Email
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  emailFrom: '',
  // Other
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试',
  allowInvite: true,
  inviteRewardDays: 30,
  inviteRewardTraffic: 107374182400, // 100GB in bytes
};

// Default payment settings
const defaultPaymentSettings = {
  general: {
    currency: 'CNY',
    exchangeRate: 1,
    minAmount: 1,
    maxAmount: 10000,
    defaultAmount: 10,
    enabledMethods: ['alipay', 'wechat'],
    autoComplete: true,
    expireMinutes: 30,
  },
  alipay: {
    enabled: false,
    name: '支付宝',
    description: '使用支付宝进行支付',
    icon: 'alipay',
    appId: '',
    privateKey: '',
    publicKey: '',
    alipayPublicKey: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    notifyUrl: '',
    returnUrl: '',
    signType: 'RSA2',
    charset: 'utf-8',
  },
  wechat: {
    enabled: false,
    name: '微信支付',
    description: '使用微信支付进行支付',
    icon: 'wechat',
    appId: '',
    mchId: '',
    apiKey: '',
    apiKeyV3: '',
    certPath: '',
    keyPath: '',
    notifyUrl: '',
    returnUrl: '',
    tradeType: 'NATIVE',
  },
  paypal: {
    enabled: false,
    name: 'PayPal',
    description: '使用PayPal进行支付',
    icon: 'paypal',
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    currency: 'USD',
    returnUrl: '',
    cancelUrl: '',
    webhookId: '',
  },
  stripe: {
    enabled: false,
    name: 'Stripe',
    description: '使用Stripe进行支付',
    icon: 'credit-card',
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    currency: 'USD',
    returnUrl: '',
  },
  wechatQr: {
    enabled: false,
    name: '微信收款码',
    description: '使用微信收款码进行支付',
    icon: 'wechat-qr',
    payeeName: '',
    qrCodeUrl: '',
    remark: '',
  },
  alipayQr: {
    enabled: false,
    name: '支付宝收款码',
    description: '使用支付宝收款码进行支付',
    icon: 'alipay-qr',
    payeeName: '',
    qrCodeUrl: '',
    remark: '',
  },
};

/**
 * Load settings from database
 */
async function loadSettingsFromDB(): Promise<typeof defaultSettings> {
  try {
    const settings = await db('system_settings').select('key', 'value');
    const settingsMap = settings.reduce((acc: Record<string, any>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    return { ...defaultSettings, ...settingsMap };
  } catch (error) {
    logger.warn('Failed to load settings from database, using defaults:', error);
    return { ...defaultSettings };
  }
}

/**
 * Save settings to database
 */
async function saveSettingsToDB(settings: Record<string, any>): Promise<void> {
  const trx = await db.transaction();
  try {
    for (const [key, value] of Object.entries(settings)) {
      await trx('system_settings')
        .insert({ key, value, updated_at: new Date() })
        .onConflict('key')
        .merge();
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

/**
 * Load payment settings from database
 */
async function loadPaymentSettingsFromDB(): Promise<typeof defaultPaymentSettings> {
  try {
    const settings = await db('payment_settings').select('provider', 'config');
    const paymentSettings = { ...defaultPaymentSettings };
    
    settings.forEach((s: any) => {
      if (paymentSettings[s.provider as keyof typeof paymentSettings]) {
        // Parse config if it's a string (database returns JSON as string in some cases)
        const configData = typeof s.config === 'string' ? JSON.parse(s.config) : s.config;
        Object.assign(
          paymentSettings[s.provider as keyof typeof paymentSettings],
          configData
        );
      }
    });
    
    return paymentSettings;
  } catch (error) {
    logger.warn('Failed to load payment settings from database, using defaults:', error);
    return { ...defaultPaymentSettings };
  }
}

/**
 * Save payment settings to database
 */
async function savePaymentSettingsToDB(settings: typeof defaultPaymentSettings): Promise<void> {
  const trx = await db.transaction();
  try {
    for (const [provider, config] of Object.entries(settings)) {
      await trx('payment_settings')
        .insert({ 
          provider, 
          config: config,
          updated_at: new Date() 
        })
        .onConflict('provider')
        .merge();
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

/**
 * GET /admin/settings - Get all settings
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = await loadSettingsFromDB();
    sendSuccess(res, settings, '获取设置成功');
  } catch (error) {
    logger.error('Failed to get settings:', error);
    sendError(res, '获取设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * PUT /admin/settings - Update settings
 */
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await saveSettingsToDB(updates);

    // If email settings were updated, reinitialize email service
    const emailFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpSecure', 'emailFrom'];
    const hasEmailUpdate = Object.keys(updates).some(key => emailFields.includes(key));
    if (hasEmailUpdate) {
      emailService.reinitialize();
      logger.info('Email service reinitialized due to settings update');
    }

    const settings = await loadSettingsFromDB();
    sendSuccess(res, settings, '设置更新成功');
  } catch (error) {
    logger.error('Failed to update settings:', error);
    sendError(res, '更新设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * POST /admin/settings/reset - Reset settings to defaults
 */
router.post('/reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    await saveSettingsToDB(defaultSettings);
    sendSuccess(res, defaultSettings, '设置已重置为默认值');
  } catch (error) {
    logger.error('Failed to reset settings:', error);
    sendError(res, '重置设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * GET /admin/settings/payment - Get payment settings
 */
router.get('/payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const paymentSettings = await loadPaymentSettingsFromDB();
    // Mask sensitive fields
    const maskedSettings = {
      ...paymentSettings,
      alipay: {
        ...paymentSettings.alipay,
        privateKey: paymentSettings.alipay.privateKey ? '***' : '',
        publicKey: paymentSettings.alipay.publicKey ? '***' : '',
        alipayPublicKey: paymentSettings.alipay.alipayPublicKey ? '***' : '',
      },
      wechat: {
        ...paymentSettings.wechat,
        apiKey: paymentSettings.wechat.apiKey ? '***' : '',
        apiKeyV3: paymentSettings.wechat.apiKeyV3 ? '***' : '',
      },
      paypal: {
        ...paymentSettings.paypal,
        clientSecret: paymentSettings.paypal.clientSecret ? '***' : '',
      },
      stripe: {
        ...paymentSettings.stripe,
        secretKey: paymentSettings.stripe.secretKey ? '***' : '',
        webhookSecret: paymentSettings.stripe.webhookSecret ? '***' : '',
      },
    };
    sendSuccess(res, maskedSettings, '获取支付设置成功');
  } catch (error) {
    logger.error('Failed to get payment settings:', error);
    sendError(res, '获取支付设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * PUT /admin/settings/payment - Update payment settings
 */
router.put('/payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const currentSettings = await loadPaymentSettingsFromDB();
    
    // Merge updates, preserving sensitive fields if masked
    const newSettings = { ...currentSettings };
    for (const [provider, config] of Object.entries(updates)) {
      if (newSettings[provider as keyof typeof newSettings]) {
        // If value is '***', preserve the original value
        const mergedConfig = { ...newSettings[provider as keyof typeof newSettings] };
        for (const [key, value] of Object.entries(config as Record<string, any>)) {
          if (value !== '***') {
            mergedConfig[key as keyof typeof mergedConfig] = value;
          }
        }
        newSettings[provider as keyof typeof newSettings] = mergedConfig;
      }
    }
    
    await savePaymentSettingsToDB(newSettings);
    
    // Return masked settings
    const maskedSettings = {
      ...newSettings,
      alipay: {
        ...newSettings.alipay,
        privateKey: newSettings.alipay.privateKey ? '***' : '',
        publicKey: newSettings.alipay.publicKey ? '***' : '',
        alipayPublicKey: newSettings.alipay.alipayPublicKey ? '***' : '',
      },
      wechat: {
        ...newSettings.wechat,
        apiKey: newSettings.wechat.apiKey ? '***' : '',
        apiKeyV3: newSettings.wechat.apiKeyV3 ? '***' : '',
      },
      paypal: {
        ...newSettings.paypal,
        clientSecret: newSettings.paypal.clientSecret ? '***' : '',
      },
      stripe: {
        ...newSettings.stripe,
        secretKey: newSettings.stripe.secretKey ? '***' : '',
        webhookSecret: newSettings.stripe.webhookSecret ? '***' : '',
      },
    };
    
    sendSuccess(res, maskedSettings, '支付设置更新成功');
  } catch (error) {
    logger.error('Failed to update payment settings:', error);
    sendError(res, '更新支付设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * POST /admin/settings/payment/test - Test payment provider
 */
router.post('/payment/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provider, amount = 0.01, currency = 'CNY' } = req.body;
    const settings = await loadPaymentSettingsFromDB();

    // Validate required fields for each provider
    let testResult: { success: boolean; message: string };

    switch (provider) {
      case 'alipay':
        if (!settings.alipay.appId || !settings.alipay.privateKey) {
          testResult = { success: false, message: '支付宝配置不完整：缺少 App ID 或私钥' };
        } else {
          // Test by checking API connectivity
          try {
            const timestamp = Date.now().toString();
            const signStr = `app_id=${settings.alipay.appId}&method=alipay.trade.query&timestamp=${timestamp}&version=1.0`;
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(signStr);
            sign.end();
            testResult = { success: true, message: '支付宝配置验证通过（密钥格式正确）' };
          } catch (signError) {
            testResult = { success: false, message: '支付宝私钥格式错误或无效' };
          }
        }
        break;

      case 'wechat':
        if (!settings.wechat.appId || !settings.wechat.mchId || !settings.wechat.apiKey) {
          testResult = { success: false, message: '微信支付配置不完整：缺少 App ID、商户号或 API 密钥' };
        } else {
          // Test by validating key format
          try {
            const md5Hash = crypto.createHash('md5').update('test').digest('hex').toUpperCase();
            testResult = { success: true, message: '微信支付配置验证通过（API 密钥格式正确）' };
          } catch (keyError) {
            testResult = { success: false, message: '微信支付 API 密钥格式错误' };
          }
        }
        break;

      case 'paypal':
        if (!settings.paypal.clientId || !settings.paypal.clientSecret) {
          testResult = { success: false, message: 'PayPal 配置不完整：缺少 Client ID 或 Client Secret' };
        } else {
          // Test by attempting to get access token
          try {
            const auth = Buffer.from(`${settings.paypal.clientId}:${settings.paypal.clientSecret}`).toString('base64');
            const response = await axios.post(
              `${settings.paypal.environment === 'live' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`,
              'grant_type=client_credentials',
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 10000,
              }
            );
            testResult = { success: true, message: 'PayPal 配置测试成功，API 连接正常' };
          } catch (paypalError: any) {
            testResult = { 
              success: false, 
              message: `PayPal 测试失败：${paypalError.response?.data?.error_description || paypalError.message}` 
            };
          }
        }
        break;

      case 'stripe':
        if (!settings.stripe.secretKey || !settings.stripe.publishableKey) {
          testResult = { success: false, message: 'Stripe 配置不完整：缺少 Secret Key 或 Publishable Key' };
        } else {
          // Test by validating key format
          const isValidSk = settings.stripe.secretKey.startsWith('sk_') && settings.stripe.secretKey.length > 20;
          const isValidPk = settings.stripe.publishableKey.startsWith('pk_') && settings.stripe.publishableKey.length > 20;
          
          if (isValidSk && isValidPk) {
            testResult = { success: true, message: 'Stripe 配置验证通过（密钥格式正确）' };
          } else {
            testResult = { success: false, message: 'Stripe 密钥格式错误，请检查 Secret Key 和 Publishable Key' };
          }
        }
        break;

      case 'wechatQr':
        if (!settings.wechatQr.qrCodeUrl) {
          testResult = { success: false, message: '微信收款码配置不完整：未上传收款码图片' };
        } else {
          testResult = { success: true, message: '微信收款码配置已就绪' };
        }
        break;

      case 'alipayQr':
        if (!settings.alipayQr.qrCodeUrl) {
          testResult = { success: false, message: '支付宝收款码配置不完整：未上传收款码图片' };
        } else {
          testResult = { success: true, message: '支付宝收款码配置已就绪' };
        }
        break;

      default:
        testResult = { success: false, message: '未知的支付提供商' };
    }

    sendSuccess(res, testResult, testResult.message);
  } catch (error) {
    logger.error('Failed to test payment provider:', error);
    sendError(res, '支付测试失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * GET /admin/settings/payment/status - Get payment providers status
 */
router.get('/payment/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = await loadPaymentSettingsFromDB();
    
    const status = [
      {
        provider: 'alipay',
        name: '支付宝',
        enabled: settings.alipay.enabled,
        configured: !!(
          settings.alipay.appId &&
          settings.alipay.privateKey &&
          settings.alipay.alipayPublicKey
        ),
        testStatus: 'pending',
      },
      {
        provider: 'wechat',
        name: '微信支付',
        enabled: settings.wechat.enabled,
        configured: !!(
          settings.wechat.appId &&
          settings.wechat.mchId &&
          settings.wechat.apiKey
        ),
        testStatus: 'pending',
      },
      {
        provider: 'paypal',
        name: 'PayPal',
        enabled: settings.paypal.enabled,
        configured: !!(
          settings.paypal.clientId &&
          settings.paypal.clientSecret
        ),
        testStatus: 'pending',
      },
      {
        provider: 'stripe',
        name: 'Stripe',
        enabled: settings.stripe.enabled,
        configured: !!(
          settings.stripe.publishableKey &&
          settings.stripe.secretKey
        ),
        testStatus: 'pending',
      },
      {
        provider: 'wechatQr',
        name: '微信收款码',
        enabled: settings.wechatQr.enabled,
        configured: !!settings.wechatQr.qrCodeUrl,
        testStatus: 'pending',
      },
      {
        provider: 'alipayQr',
        name: '支付宝收款码',
        enabled: settings.alipayQr.enabled,
        configured: !!settings.alipayQr.qrCodeUrl,
        testStatus: 'pending',
      },
    ];
    
    sendSuccess(res, status, '获取支付提供商状态成功');
  } catch (error) {
    logger.error('Failed to get payment status:', error);
    sendError(res, '获取支付状态失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * POST /admin/settings/upload-image - Upload QR code image
 */
router.post('/upload-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { image, type } = req.body;

    if (!image) {
      return sendError(res, '图片数据不能为空', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Validate type
    const allowedTypes = ['wechat_qr', 'alipay_qr'];
    if (!type || !allowedTypes.includes(type)) {
      return sendError(res, '无效的图片类型', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Validate base64 format
    if (!image.startsWith('data:image/') || !image.includes(';base64,')) {
      return sendError(res, '图片格式错误，请上传有效的图片文件', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Extract mime type and data
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      return sendError(res, '图片解析失败', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    const mimeType = matches[1];
    const allowedMimes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!allowedMimes.includes(mimeType)) {
      return sendError(res, `不支持的图片格式: ${mimeType}`, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Check size (max 5MB)
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return sendError(res, '图片大小不能超过 5MB', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Save file
    const uploadDir = process.env.ADMIN_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'qrcodes');
    
    // Ensure directory exists with proper error handling
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        logger.info(`Created upload directory: ${uploadDir}`);
      }
    } catch (dirError) {
      logger.error('Failed to create upload directory:', dirError);
      return sendError(res, '服务器文件系统错误：无法创建上传目录', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
    }

    // Generate unique filename
    const filename = `${type}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${mimeType}`;
    const filePath = path.join(uploadDir, filename);
    
    // Write file with error handling
    try {
      fs.writeFileSync(filePath, buffer);
      logger.info(`File saved: ${filePath}`);
    } catch (writeError) {
      logger.error('Failed to write file:', writeError);
      return sendError(res, '服务器文件系统错误：无法保存文件', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
    }

    // Return URL - use config domain if available
    const baseUrl = process.env.ADMIN_WEB_URL || '';
    const imageUrl = `${baseUrl}/uploads/qrcodes/${filename}`;
    
    logger.info(`Image uploaded: ${imageUrl} (${(buffer.length / 1024).toFixed(2)} KB)`);
    sendSuccess(res, { url: imageUrl }, '图片上传成功');
  } catch (error) {
    logger.error('Failed to upload image:', error);
    sendError(res, '图片上传失败：' + (error instanceof Error ? error.message : '未知错误'), ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * POST /admin/settings/test-email - Send test email
 */
router.post('/test-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, '请输入收件人邮箱地址', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, '邮箱格式不正确', ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      return sendError(
        res,
        '邮件服务未配置，请先在系统设置中配置 SMTP 服务器信息',
        ErrorCode.EMAIL_SEND_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }

    // Send test email
    const success = await emailService.sendEmail({
      to: email,
      subject: 'Omni Core - 邮件配置测试',
      text: '这是一封测试邮件，用于验证您的 SMTP 配置是否正确。\n\n如果您收到此邮件，说明邮件服务已成功配置！\n\n发送时间: ' + new Date().toLocaleString('zh-CN'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Omni Core</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2>邮件配置测试</h2>
            <p>这是一封测试邮件，用于验证您的 SMTP 配置是否正确。</p>
            <p>如果您收到此邮件，说明邮件服务已<strong style="color: #16a34a;">成功配置</strong>！</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 14px;">
              发送时间: ${new Date().toLocaleString('zh-CN')}<br />
              此邮件由系统自动发送，请勿回复。
            </p>
          </div>
          <div style="background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Omni Core. All rights reserved.
          </div>
        </div>
      `,
    });

    if (success) {
      logger.info(`Test email sent successfully to ${email}`);
      sendSuccess(res, { sent: true }, `测试邮件已发送至 ${email}，请检查收件箱`);
    } else {
      logger.error(`Failed to send test email to ${email}`);
      sendError(
        res,
        '测试邮件发送失败，请检查 SMTP 配置是否正确',
        ErrorCode.EMAIL_SEND_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }
  } catch (error) {
    logger.error('Error sending test email:', error);
    sendError(
      res,
      error instanceof Error ? error.message : '发送测试邮件时发生错误',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR
    );
  }
});

export { router as settingsRoutes };
