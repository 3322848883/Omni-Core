"use strict";
/**
 * 安全配置模块
 * 包含 HSTS、CORS、请求限制等安全相关配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityConfig = exports.defaultSecurityHeaders = exports.defaultRequestLimits = exports.defaultHSTSConfig = void 0;
exports.createCORSConfig = createCORSConfig;
exports.generateHSTSHeader = generateHSTSHeader;
exports.validateUrlLength = validateUrlLength;
exports.getDatabaseSSLConfig = getDatabaseSSLConfig;
/**
 * HSTS 默认配置
 * max-age: 31536000 秒 = 365 天
 */
exports.defaultHSTSConfig = {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
};
/**
 * 默认请求限制配置
 */
exports.defaultRequestLimits = {
    bodySize: '10mb',
    urlParamMaxLength: 2048,
    jsonLimit: '10mb',
    urlencodedLimit: '10mb',
};
/**
 * 默认安全头配置
 */
exports.defaultSecurityHeaders = {
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
function createCORSConfig(allowedOrigins) {
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
function generateHSTSHeader(config = exports.defaultHSTSConfig) {
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
function validateUrlLength(url, maxLength = 2048) {
    return url.length <= maxLength;
}
/**
 * 获取数据库 SSL 配置
 * @returns SSL 配置对象
 */
function getDatabaseSSLConfig() {
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
exports.securityConfig = {
    hsts: exports.defaultHSTSConfig,
    requestLimits: exports.defaultRequestLimits,
    securityHeaders: exports.defaultSecurityHeaders,
    createCORSConfig,
    generateHSTSHeader,
    validateUrlLength,
    getDatabaseSSLConfig,
};
exports.default = exports.securityConfig;
//# sourceMappingURL=security.js.map