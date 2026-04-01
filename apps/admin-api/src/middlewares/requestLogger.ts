import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'authorization',
];

/**
 * 脱敏敏感数据
 * @param obj - 要处理的对象
 * @returns 脱敏后的对象
 */
function sanitizeSensitiveData<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSensitiveData(item)) as unknown as T;
  }

  const sanitized = { ...obj } as Record<string, unknown>;

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      const value = sanitized[key];
      if (typeof value === 'string') {
        // 保留前3位和后3位，中间用 *** 代替
        if (value.length > 6) {
          sanitized[key] = value.substring(0, 3) + '***' + value.substring(value.length - 3);
        } else {
          sanitized[key] = '***';
        }
      } else {
        sanitized[key] = '***';
      }
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }

  return sanitized as T;
}

// API 版本
const API_VERSION = process.env.npm_package_version || '1.0.0';

/**
 * Request logging middleware with sensitive data sanitization
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // 添加 API 版本响应头
  res.setHeader('X-API-Version', API_VERSION);

  res.on('finish', () => {
    const duration = Date.now() - start;

    // 脱敏请求体和查询参数
    const sanitizedBody = sanitizeSensitiveData(req.body);
    const sanitizedQuery = sanitizeSensitiveData(req.query);

    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.headers['x-request-id'],
      userId: (req as any).user?.id,
      // 只记录脱敏后的数据
      ...(Object.keys(sanitizedQuery).length > 0 && { query: sanitizedQuery }),
      ...(Object.keys(sanitizedBody).length > 0 && { body: sanitizedBody }),
    };

    if (res.statusCode >= 400) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
  });

  next();
};
