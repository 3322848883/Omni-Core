/**
 * General rate limiter for all routes
 */
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Stricter rate limiter for authentication routes
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * API rate limiter for sensitive operations
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map