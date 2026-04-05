"use strict";
/**
 * 安全配置模块
 * 包含 HSTS、CORS、请求限制等安全相关配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSecurityHeaders = exports.defaultRequestLimits = exports.defaultHSTSConfig = void 0;
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
    frameguard: { action: 'sameorigin' },
};
//# sourceMappingURL=security.js.map