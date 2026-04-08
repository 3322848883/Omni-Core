import dotenv from 'dotenv';
import path from 'path';

// 根据 NODE_ENV 加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(__dirname, '..', '..', envFile) });

/**
 * 生产环境安全检查
 * 确保关键配置已设置
 */
function validateProductionConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    // 检查 JWT_SECRET
    const jwtSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'default_secret_key') {
      console.error('[FATAL] JWT_SECRET is not configured in production environment');
      console.error('Please set ADMIN_JWT_SECRET or JWT_SECRET environment variable');
      process.exit(1);
    }

    // 检查 JWT_REFRESH_SECRET
    const jwtRefreshSecret = process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret || jwtRefreshSecret === 'default_refresh_secret') {
      console.error('[FATAL] JWT_REFRESH_SECRET is not configured in production environment');
      console.error('Please set ADMIN_JWT_REFRESH_SECRET or JWT_REFRESH_SECRET environment variable');
      process.exit(1);
    }
  }
}

// 执行生产环境配置验证
validateProductionConfig();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3005', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1/admin',

  // Domain Configuration (per domain-config.md)
  domain: {
    // Root domain
    root: process.env.DOMAIN_ROOT || 'embarks.uk',
    // Admin domain
    admin: process.env.DOMAIN_ADMIN || 'admin.embarks.uk',
    // API domain
    api: process.env.DOMAIN_API || 'api.embarks.uk',
    // User-facing client domain
    client: process.env.DOMAIN_CLIENT || 'embarks.uk',
    // Environment
    env: process.env.DOMAIN_ENV || 'production',
  },

  // Computed API URL (derived from domain config)
  apiUrl: `https://${process.env.DOMAIN_API || 'api.embarks.uk'}`,

  // Database
  database: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'omnicore_admin',
      user: process.env.DB_USER || 'omnicore',
      password: process.env.DB_PASSWORD || '',
    },
  },

  // Legacy db config for backward compatibility
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'omnicore_admin',
    user: process.env.DB_USER || 'omnicore',
    password: process.env.DB_PASSWORD || '',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT - 使用独立的环境变量名，确保与管理端密钥隔离
  jwt: {
    secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'default_secret_key',
    refreshSecret: process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '2h', // Access token: 2 hours
    refreshExpiresIn: process.env.ADMIN_JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh token: 7 days
    accessTokenPrefix: 'aat_',
    refreshTokenPrefix: 'art_',
  },

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Xray API
  xray: {
    host: process.env.XRAY_API_HOST || 'localhost',
    port: parseInt(process.env.XRAY_API_PORT || '10085', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
    adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || '',
  },

  // Frontend
  adminWebUrl: process.env.ADMIN_WEB_URL || 'http://localhost:5173',

  // CORS Configuration
  // Comma-separated list of allowed origins
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:8080',
          'http://localhost:8081',
          'http://localhost:8082',
          `https://admin.${process.env.DOMAIN_ROOT || 'embarks.uk'}`,
          `https://staging-admin.${process.env.DOMAIN_ROOT || 'embarks.uk'}`,
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Signature', 'X-Timestamp', 'X-Nonce'],
  },

  // Payment
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET || '',
      sandbox: process.env.PAYPAL_SANDBOX === 'true',
    },
    alipay: {
      qrCodeUrl: process.env.ALIPAY_QR_CODE_URL || '',
      receiverName: process.env.ALIPAY_RECEIVER_NAME || '',
    },
    wechat: {
      qrCodeUrl: process.env.WECHAT_QR_CODE_URL || '',
      receiverName: process.env.WECHAT_RECEIVER_NAME || '',
    },
    alipayMerchant: {
      appId: process.env.ALIPAY_MERCHANT_APP_ID || '',
      privateKey: process.env.ALIPAY_MERCHANT_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_MERCHANT_PUBLIC_KEY || '',
      sandbox: process.env.ALIPAY_MERCHANT_SANDBOX !== 'false',
    },
    wechatMerchant: {
      mchId: process.env.WECHAT_MERCHANT_MCH_ID || '',
      appId: process.env.WECHAT_MERCHANT_APP_ID || '',
      apiKey: process.env.WECHAT_MERCHANT_API_KEY || '',
      sandbox: process.env.WECHAT_MERCHANT_SANDBOX !== 'false',
    },
    defaultCurrency: process.env.PAYMENT_DEFAULT_CURRENCY || 'USD',
  },

  // RabbitMQ
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'omnicore',
    password: process.env.RABBITMQ_PASSWORD || 'omnicore123',
    vhost: process.env.RABBITMQ_VHOST || '/',
  },

  // Queues
  queues: {
    email: process.env.QUEUE_EMAIL || 'omnicore.email',
    trafficStats: process.env.QUEUE_TRAFFIC_STATS || 'omnicore.traffic.stats',
  },
};
