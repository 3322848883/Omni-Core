/**
 * 支付提供商配置
 */
export interface PaymentProviderConfig {
  enabled: boolean;
  name: string;
  description: string;
  icon: string;
}

/**
 * 支付宝配置
 */
export interface AlipayConfig extends PaymentProviderConfig {
  appId: string;
  privateKey: string;
  publicKey: string;
  alipayPublicKey: string;
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
  signType: 'RSA2' | 'RSA';
  charset: string;
}

/**
 * 微信支付配置
 */
export interface WechatConfig extends PaymentProviderConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  apiKeyV3: string;
  certPath: string;
  keyPath: string;
  notifyUrl: string;
  returnUrl: string;
  tradeType: 'NATIVE' | 'JSAPI' | 'H5' | 'APP';
}

/**
 * PayPal配置
 */
export interface PayPalConfig extends PaymentProviderConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  webhookId: string;
}

/**
 * Stripe配置
 */
export interface StripeConfig extends PaymentProviderConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  returnUrl: string;
}

/**
 * 支付通用配置
 */
export interface PaymentGeneralConfig {
  currency: string;
  exchangeRate: number;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  enabledMethods: string[];
  autoComplete: boolean;
  expireMinutes: number;
}

/**
 * 收款码配置
 */
export interface QRCodeConfig extends PaymentProviderConfig {
  payeeName: string;
  qrCodeUrl: string;
  remark: string;
}

/**
 * 完整支付配置
 */
export interface PaymentSettings {
  general: PaymentGeneralConfig;
  alipay: AlipayConfig;
  wechat: WechatConfig;
  paypal: PayPalConfig;
  stripe: StripeConfig;
  wechatQr?: QRCodeConfig;
  alipayQr?: QRCodeConfig;
}

/**
 * 支付测试请求
 */
export interface PaymentTestRequest {
  provider: string;
  amount: number;
  currency: string;
}

/**
 * 支付测试响应
 */
export interface PaymentTestResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    paymentUrl?: string;
    qrCode?: string;
  };
}

/**
 * 支付提供商状态
 */
export interface PaymentProviderStatus {
  provider: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  testStatus: 'pending' | 'success' | 'failed';
  lastTestTime?: string;
  errorMessage?: string;
}
