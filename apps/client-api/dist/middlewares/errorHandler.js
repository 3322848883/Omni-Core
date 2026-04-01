"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const constants_1 = require("@/constants");
const logger_1 = __importDefault(require("@/utils/logger"));
const response_1 = require("@/utils/response");
const errorHandler = (err, req, res, _next) => {
    const requestId = req.requestId || (0, response_1.createRequestId)();
    // Log error
    logger_1.default.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId,
    });
    // Handle AppError
    if (err?.name === 'AppError') {
        const appErr = err;
        res.status(appErr.statusCode || constants_1.HttpStatus.INTERNAL_ERROR).json({
            success: false,
            code: appErr.code || constants_1.ErrorCode.INTERNAL_ERROR,
            message: appErr.message,
            requestId,
            timestamp: Date.now(),
        });
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(constants_1.HttpStatus.UNAUTHORIZED).json({
            success: false,
            code: constants_1.HttpStatus.UNAUTHORIZED,
            message: 'Invalid token',
            errors: [{
                    field: 'token',
                    message: 'Invalid token',
                }],
            requestId,
            timestamp: Date.now(),
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(constants_1.HttpStatus.UNAUTHORIZED).json({
            success: false,
            code: constants_1.HttpStatus.UNAUTHORIZED,
            message: 'Token expired',
            errors: [{
                    field: 'token',
                    message: 'Token has expired',
                }],
            requestId,
            timestamp: Date.now(),
        });
        return;
    }
    // Handle unknown errors
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(constants_1.HttpStatus.INTERNAL_ERROR).json({
        success: false,
        code: constants_1.HttpStatus.INTERNAL_ERROR,
        message: isDevelopment ? err.message : 'Internal server error',
        errors: isDevelopment ? [{
                field: 'general',
                message: err.message,
            }] : undefined,
        requestId,
        timestamp: Date.now(),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map