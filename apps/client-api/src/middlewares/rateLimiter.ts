import rateLimit from 'express-rate-limit';
import config from '@/config';
import { TooManyRequestsError } from '@/errors/AppError';

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests, please try again later'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

/**
 * Stricter rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Temporarily increased for testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many authentication attempts, please try again later'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  skipSuccessfulRequests: false,
});

/**
 * API rate limiter for sensitive operations
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('API rate limit exceeded'));
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});
