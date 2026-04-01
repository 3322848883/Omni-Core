/**
 * 安全配置模块
 * 包含 HSTS、CORS、请求限制等安全相关配置
 */

import type { CorsOptions } from 'cors';

/**
 * HSTS 配置选项
 */
export interface HSTSConfig {
  /** 缓存时间（秒），默认一年 */
  maxAge: number;
  /** 是否包含子域名 */
  includeSubDomains: boolean;
  /** 是否预加载到浏览器 */
  preload: boolean;
}

/**
 * 请求限制配置
 */
export interface RequestLimits {
  /** 请求体大小限制（如 '10mb'） */
  bodySize: string;
  /** URL 参数最大长度 */
  urlParamMaxLength: number;
  /** JSON 请求体大小限制 */
  jsonLimit: string;
  /** URL 编码请求体大小限制 */
  urlencodedLimit: string;
}

/**
 * 安全头配置
 */
export interface SecurityHeaders {
  /** 内容安全策略 */
  contentSecurityPolicy: {
    directives: {
      defaultSrc: string[];
      styleSrc: string[];
      scriptSrc: string[];
      imgSrc: string[];
    };
  };
  /** 是否启用 XSS 过滤 */
  xssFilter: boolean;
  /** 是否禁止 MIME 类型嗅探 */
  noSniff: boolean;
  /** 点击劫持保护 */
  frameguard: { action: 'deny' | 'sameorigin' };
}

/**
 * HSTS 默认配置
 * max-age: 31536000 秒 = 365 天
 */
export const defaultHSTSConfig: HSTSConfig = {
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
};

/**
 * 默认请求限制配置
 */
export const defaultRequestLimits: RequestLimits = {
  bodySize: '10mb',
  urlParamMaxLength: 2048,
  jsonLimit: '10mb',
  urlencodedLimit: '10mb',
};

/**
 * 默认安全头配置
 */
export const defaultSecurityHeaders: SecurityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' },
};

/**
 * 生成 CORS 配置
 * @param allowedOrigins 允许的域名列表
 * @returns CORS 配置对象
 */
export function createCORSConfig(allowedOrigins: string[]): CorsOptions {
  return {
    origin: (origin, callback) => {
      // 允许无来源的请求（如移动应用、curl 等）
      if (!origin) {
        return callback(null, true);
      }

      // 检查来源是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 开发环境允许所有来源
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // 拒绝未授权的来源
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-CSRF-Token',
      'X-Signature',
      'X-Timestamp',
      'X-Nonce',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 小时
  };
}

/**
 * 生成 HSTS 响应头值
 * @param config HSTS 配置
 * @returns HSTS 响应头字符串
 */
export function generateHSTSHeader(config: HSTSConfig = defaultHSTSConfig): string {
  let headerValue = `max-age=${config.maxAge}`;

  if (config.includeSubDomains) {
    headerValue += '; includeSubDomains';
  }

  if (config.preload) {
    headerValue += '; preload';
  }

  return headerValue;
}

/**
 * 验证 URL 参数长度
 * @param url URL 字符串
 * @param maxLength 最大长度限制
 * @returns 是否通过验证
 */
export function validateUrlLength(url: string, maxLength: number = 2048): boolean {
  return url.length <= maxLength;
}

/**
 * 数据库 SSL 配置
 */
export interface DatabaseSSLConfig {
  /** 是否强制使用 SSL */
  rejectUnauthorized: boolean;
  /** CA 证书（生产环境推荐） */
  ca?: string;
  /** 客户端证书 */
  cert?: string;
  /** 客户端密钥 */
  key?: string;
}

/**
 * 获取数据库 SSL 配置
 * @returns SSL 配置对象
 */
export function getDatabaseSSLConfig(): DatabaseSSLConfig | false {
  const env = process.env.NODE_ENV || 'development';

  // 生产环境强制使用 SSL
  if (env === 'production') {
    return {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA,
      cert: process.env.DB_SSL_CERT,
      key: process.env.DB_SSL_KEY,
    };
  }

  // 开发环境可选 SSL
  if (process.env.DB_SSL === 'true') {
    return {
      rejectUnauthorized: false,
    };
  }

  return false;
}

/**
 * 安全中间件配置对象
 * 用于统一管理所有安全配置
 */
export const securityConfig = {
  hsts: defaultHSTSConfig,
  requestLimits: defaultRequestLimits,
  securityHeaders: defaultSecurityHeaders,
  createCORSConfig,
  generateHSTSHeader,
  validateUrlLength,
  getDatabaseSSLConfig,
};

export default securityConfig;
