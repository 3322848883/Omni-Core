"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const constants_1 = require("@shared/constants");
const errorHandler = (err, req, res, _next) => {
    const requestId = (0, response_1.createRequestId)();
    // Handle AppError/ValidationError instances
    if (err && (err.name === 'AppError' || err.name === 'ValidationError')) {
        const statusCode = err.statusCode || constants_1.HttpStatus.INTERNAL_ERROR;
        const errorCode = err.code || constants_1.ErrorCode.INTERNAL_ERROR;
        const message = err.message || 'Internal server error';
        // Log error with request ID
        logger_1.logger.error({
            message: 'API Error',
            error: {
                code: errorCode,
                message: err.message,
                stack: err.stack,
            },
            request: {
                method: req.method,
                path: req.path,
                query: req.query,
                body: redactSensitiveBody(req.body),
                headers: redactSensitiveHeaders(req.headers),
                ip: req.ip,
            },
            requestId,
        });
        // Build response
        const response = {
            success: false,
            code: statusCode,
            message: process.env.NODE_ENV === 'production' && statusCode === constants_1.HttpStatus.INTERNAL_ERROR
                ? 'Internal server error'
                : message,
            timestamp: Date.now(),
            requestId,
        };
        // Add validation errors if present
        if (err.name === 'ValidationError' && err.errors) {
            response.errors = err.errors;
        }
        res.status(statusCode).json(response);
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        logger_1.logger.error({
            message: 'JWT Error',
            error: err.message,
            requestId,
        });
        res.status(constants_1.HttpStatus.UNAUTHORIZED).json({
            success: false,
            code: constants_1.HttpStatus.UNAUTHORIZED,
            message: 'Invalid token',
            errors: [{
                    field: 'token',
                    message: 'Invalid token',
                }],
            timestamp: Date.now(),
            requestId,
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        logger_1.logger.error({
            message: 'JWT Token Expired',
            error: err.message,
            requestId,
        });
        res.status(constants_1.HttpStatus.UNAUTHORIZED).json({
            success: false,
            code: constants_1.HttpStatus.UNAUTHORIZED,
            message: 'Token expired',
            errors: [{
                    field: 'token',
                    message: 'Token has expired',
                }],
            timestamp: Date.now(),
            requestId,
        });
        return;
    }
    // Handle generic errors
    const statusCode = err.statusCode || constants_1.HttpStatus.INTERNAL_ERROR;
    const errorCode = err.code || constants_1.ErrorCode.INTERNAL_ERROR;
    const message = err.message || 'Internal server error';
    // Log error
    logger_1.logger.error({
        message: 'API Error',
        error: {
            code: errorCode,
            message: err.message,
            stack: err.stack,
            details: err.details,
        },
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: redactSensitiveBody(req.body),
            headers: redactSensitiveHeaders(req.headers),
            ip: req.ip,
        },
        requestId,
    });
    // Send response
    const response = {
        success: false,
        code: statusCode,
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : message,
        timestamp: Date.now(),
        requestId,
    };
    if (err.errors) {
        response.errors = err.errors;
    }
    if (err.details) {
        response.details = err.details;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Redact sensitive fields from request body for logging
 */
function redactSensitiveBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sensitiveFields = ['password', 'passwordHash', 'mfaCode', 'token', 'refreshToken', 'secret'];
    const redacted = { ...body };
    for (const field of sensitiveFields) {
        if (field in redacted) {
            redacted[field] = '***REDACTED***';
        }
    }
    return redacted;
}
/**
 * Redact sensitive headers for logging
 */
function redactSensitiveHeaders(headers) {
    if (!headers || typeof headers !== 'object') {
        return headers;
    }
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const redacted = { ...headers };
    for (const header of sensitiveHeaders) {
        if (header in redacted) {
            redacted[header] = '***REDACTED***';
        }
    }
    return redacted;
}
const createError = (message, statusCode = constants_1.HttpStatus.INTERNAL_ERROR, code = constants_1.ErrorCode.INTERNAL_ERROR, details) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map