"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("@/config"));
const AppError_1 = require("@/errors/AppError");
/**
 * General rate limiter for all routes
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs,
    max: config_1.default.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(new AppError_1.TooManyRequestsError('Too many requests, please try again later'));
    },
    keyGenerator: (req) => {
        return req.ip || 'unknown';
    },
});
/**
 * Stricter rate limiter for authentication routes
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Temporarily increased for testing
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(new AppError_1.TooManyRequestsError('Too many authentication attempts, please try again later'));
    },
    keyGenerator: (req) => {
        return req.ip || 'unknown';
    },
    skipSuccessfulRequests: false,
});
/**
 * API rate limiter for sensitive operations
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(new AppError_1.TooManyRequestsError('API rate limit exceeded'));
    },
    keyGenerator: (req) => {
        return req.ip || 'unknown';
    },
});
//# sourceMappingURL=rateLimiter.js.map