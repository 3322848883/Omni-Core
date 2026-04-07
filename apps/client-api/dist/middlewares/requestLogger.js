"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.requestId = void 0;
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("@/utils/logger"));
// API 版本
const API_VERSION = process.env.npm_package_version || '1.0.0';
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
function sanitizeSensitiveData(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeSensitiveData(item));
    }
    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
        if (isSensitive) {
            const value = sanitized[key];
            if (typeof value === 'string') {
                // 保留前3位和后3位，中间用 *** 代替
                if (value.length > 6) {
                    sanitized[key] = value.substring(0, 3) + '***' + value.substring(value.length - 3);
                }
                else {
                    sanitized[key] = '***';
                }
            }
            else {
                sanitized[key] = '***';
            }
        }
        else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeSensitiveData(sanitized[key]);
        }
    }
    return sanitized;
}
/**
 * Request ID middleware - assigns unique ID to each request
 */
const requestId = (req, _res, next) => {
    req.requestId = (0, uuid_1.v4)();
    next();
};
exports.requestId = requestId;
/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // 添加 API 版本响应头
    res.setHeader('X-API-Version', API_VERSION);
    res.on('finish', () => {
        const duration = Date.now() - start;
        // 脱敏请求体和查询参数
        const sanitizedBody = sanitizeSensitiveData(req.body);
        const sanitizedQuery = sanitizeSensitiveData(req.query);
        const logData = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
            // 只记录脱敏后的数据
            ...(Object.keys(sanitizedQuery).length > 0 && { query: sanitizedQuery }),
            ...(Object.keys(sanitizedBody).length > 0 && { body: sanitizedBody }),
        };
        if (res.statusCode >= 400) {
            logger_1.default.warn(logData);
        }
        else {
            logger_1.default.info(logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map