"use strict";
// Custom Error Classes
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExpiredError = exports.RateLimitError = exports.BadRequestError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    errors;
    constructor(message = 'Validation failed', errors) {
        super(message, 422, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMITED');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class TokenExpiredError extends AppError {
    constructor(message = 'Token expired') {
        super(message, 401, 'TOKEN_EXPIRED');
        this.name = 'TokenExpiredError';
    }
}
exports.TokenExpiredError = TokenExpiredError;
//# sourceMappingURL=errors.js.map