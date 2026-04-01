import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production'
  ? '.env'
  : '.env.development';

const envPath = path.resolve(__dirname, '..', '..', envFile);
dotenv.config({ path: envPath });

/**
 * 生产环境安全检查
 * 确保关键配置已设置
 */
function validateProductionConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    // 检查 JWT_SECRET
    const jwtSecret = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'default-secret-change-in-production') {
      console.error('[FATAL] JWT_SECRET is not configured in production environment');
      console.error('Please set CLIENT_JWT_SECRET or JWT_SECRET environment variable');
      process.exit(1);
    }

    // 检查 JWT_REFRESH_SECRET
    const jwtRefreshSecret = process.env.CLIENT_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      console.error('[FATAL] JWT_REFRESH_SECRET is not configured in production environment');
      console.error('Please set CLIENT_JWT_REFRESH_SECRET or JWT_REFRESH_SECRET environment variable');
      process.exit(1);
    }
  }
}

// 执行生产环境配置验证
validateProductionConfig();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),

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
    pool: {
      min: 5,
      max: 20,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },

  // JWT - 使用独立的环境变量名，确保与用户端密钥隔离
  jwt: {
    secret: process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.CLIENT_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.CLIENT_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.CLIENT_JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    accessTokenPrefix: 'uat_',
    refreshTokenPrefix: 'urt_',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    enabled: process.env.REDIS_HOST !== '',
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:8080,http://localhost:8081,http://localhost:8082').split(','),
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute for dev
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per minute
    authMaxRequests: 10,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  // Payment
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      mode: process.env.PAYPAL_MODE || 'sandbox',
    },
  },

  // Subscription
  subscription: {
    baseUrl: process.env.SUBSCRIPTION_BASE_URL || 'http://localhost:3002',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    maxDevices: 5,
  },
};

export default config;
