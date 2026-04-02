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
    frameguard: {
        action: 'deny' | 'sameorigin';
    };
}
/**
 * HSTS 默认配置
 * max-age: 31536000 秒 = 365 天
 */
export declare const defaultHSTSConfig: HSTSConfig;
/**
 * 默认请求限制配置
 */
export declare const defaultRequestLimits: RequestLimits;
/**
 * 默认安全头配置
 */
export declare const defaultSecurityHeaders: SecurityHeaders;
/**
 * 生成 CORS 配置
 * @param allowedOrigins 允许的域名列表
 * @returns CORS 配置对象
 */
export declare function createCORSConfig(allowedOrigins: string[]): CorsOptions;
/**
 * 生成 HSTS 响应头值
 * @param config HSTS 配置
 * @returns HSTS 响应头字符串
 */
export declare function generateHSTSHeader(config?: HSTSConfig): string;
/**
 * 验证 URL 参数长度
 * @param url URL 字符串
 * @param maxLength 最大长度限制
 * @returns 是否通过验证
 */
export declare function validateUrlLength(url: string, maxLength?: number): boolean;
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
export declare function getDatabaseSSLConfig(): DatabaseSSLConfig | false;
/**
 * 安全中间件配置对象
 * 用于统一管理所有安全配置
 */
export declare const securityConfig: {
    hsts: HSTSConfig;
    requestLimits: RequestLimits;
    securityHeaders: SecurityHeaders;
    createCORSConfig: typeof createCORSConfig;
    generateHSTSHeader: typeof generateHSTSHeader;
    validateUrlLength: typeof validateUrlLength;
    getDatabaseSSLConfig: typeof getDatabaseSSLConfig;
};
export default securityConfig;
//# sourceMappingURL=security.d.ts.map