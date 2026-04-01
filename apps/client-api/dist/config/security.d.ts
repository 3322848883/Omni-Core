/**
 * 安全配置模块
 * 包含 HSTS、CORS、请求限制等安全相关配置
 */
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
//# sourceMappingURL=security.d.ts.map