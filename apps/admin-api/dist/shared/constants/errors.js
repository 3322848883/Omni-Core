"use strict";
/**
 * FGVPN Unified Error Code System
 * 统一的错误码体系，用于 admin-api 和 client-api
 *
 * 错误码格式：大写下划线分隔（如 VALIDATION_ERROR）
 * 每个错误码包含：code, message, httpStatus
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.AppError = exports.HTTP_STATUS = exports.ERROR_CODES = exports.ErrorInfoMap = exports.ErrorCode = exports.HttpStatus = void 0;
exports.getErrorInfo = getErrorInfo;
exports.createErrorResponse = createErrorResponse;
// HTTP 状态码映射
exports.HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
};
exports.HTTP_STATUS = exports.HttpStatus;
// 业务错误码定义
exports.ErrorCode = {
    // 通用错误 (1xxx)
    BAD_REQUEST: 'BAD_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMITED: 'RATE_LIMITED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    // 认证相关错误 (2xxx)
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    DEVICE_LIMIT_EXCEEDED: 'DEVICE_LIMIT_EXCEEDED',
    // 用户相关错误 (3xxx)
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_DISABLED: 'USER_DISABLED',
    USER_BANNED: 'USER_BANNED',
    // 订单相关错误 (4xxx)
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
    ORDER_EXPIRED: 'ORDER_EXPIRED',
    // 支付相关错误 (5xxx)
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    // 订阅套餐相关错误 (6xxx)
    PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
    PLAN_NOT_AVAILABLE: 'PLAN_NOT_AVAILABLE',
    // 节点相关错误 (7xxx)
    NODE_NOT_FOUND: 'NODE_NOT_FOUND',
    NODE_OFFLINE: 'NODE_OFFLINE',
    NODE_MAINTENANCE: 'NODE_MAINTENANCE',
    // 邀请码相关错误 (8xxx)
    INVALID_INVITE_CODE: 'INVALID_INVITE_CODE',
    INVITE_CODE_USED: 'INVITE_CODE_USED',
    INVITE_CODE_EXPIRED: 'INVITE_CODE_EXPIRED',
    // 流量相关错误 (9xxx)
    TRAFFIC_EXCEEDED: 'TRAFFIC_EXCEEDED',
    INSUFFICIENT_TRAFFIC: 'INSUFFICIENT_TRAFFIC',
    // 系统错误 (10xxx)
    DATABASE_ERROR: 'DATABASE_ERROR',
    CACHE_ERROR: 'CACHE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    XRAY_API_ERROR: 'XRAY_API_ERROR',
    EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
};
exports.ERROR_CODES = exports.ErrorCode;
// 错误信息映射表
exports.ErrorInfoMap = {
    // 通用错误
    [exports.ErrorCode.BAD_REQUEST]: {
        code: exports.ErrorCode.BAD_REQUEST,
        message: 'Bad request',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.VALIDATION_ERROR]: {
        code: exports.ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.UNAUTHORIZED]: {
        code: exports.ErrorCode.UNAUTHORIZED,
        message: 'Unauthorized',
        httpStatus: exports.HttpStatus.UNAUTHORIZED,
    },
    [exports.ErrorCode.FORBIDDEN]: {
        code: exports.ErrorCode.FORBIDDEN,
        message: 'Forbidden',
        httpStatus: exports.HttpStatus.FORBIDDEN,
    },
    [exports.ErrorCode.NOT_FOUND]: {
        code: exports.ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        httpStatus: exports.HttpStatus.NOT_FOUND,
    },
    [exports.ErrorCode.CONFLICT]: {
        code: exports.ErrorCode.CONFLICT,
        message: 'Resource conflict',
        httpStatus: exports.HttpStatus.CONFLICT,
    },
    [exports.ErrorCode.RATE_LIMITED]: {
        code: exports.ErrorCode.RATE_LIMITED,
        message: 'Too many requests',
        httpStatus: exports.HttpStatus.RATE_LIMITED,
    },
    [exports.ErrorCode.INTERNAL_ERROR]: {
        code: exports.ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
    // 认证相关错误
    [exports.ErrorCode.TOKEN_EXPIRED]: {
        code: exports.ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired',
        httpStatus: exports.HttpStatus.UNAUTHORIZED,
    },
    [exports.ErrorCode.TOKEN_INVALID]: {
        code: exports.ErrorCode.TOKEN_INVALID,
        message: 'Invalid token',
        httpStatus: exports.HttpStatus.UNAUTHORIZED,
    },
    [exports.ErrorCode.TOKEN_REVOKED]: {
        code: exports.ErrorCode.TOKEN_REVOKED,
        message: 'Token has been revoked',
        httpStatus: exports.HttpStatus.UNAUTHORIZED,
    },
    [exports.ErrorCode.INVALID_CREDENTIALS]: {
        code: exports.ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
        httpStatus: exports.HttpStatus.UNAUTHORIZED,
    },
    [exports.ErrorCode.DEVICE_LIMIT_EXCEEDED]: {
        code: exports.ErrorCode.DEVICE_LIMIT_EXCEEDED,
        message: 'Device limit exceeded',
        httpStatus: exports.HttpStatus.FORBIDDEN,
    },
    // 用户相关错误
    [exports.ErrorCode.USER_NOT_FOUND]: {
        code: exports.ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
        httpStatus: exports.HttpStatus.NOT_FOUND,
    },
    [exports.ErrorCode.USER_ALREADY_EXISTS]: {
        code: exports.ErrorCode.USER_ALREADY_EXISTS,
        message: 'User already exists',
        httpStatus: exports.HttpStatus.CONFLICT,
    },
    [exports.ErrorCode.USER_DISABLED]: {
        code: exports.ErrorCode.USER_DISABLED,
        message: 'Account has been disabled',
        httpStatus: exports.HttpStatus.FORBIDDEN,
    },
    [exports.ErrorCode.USER_BANNED]: {
        code: exports.ErrorCode.USER_BANNED,
        message: 'Account has been banned',
        httpStatus: exports.HttpStatus.FORBIDDEN,
    },
    // 订单相关错误
    [exports.ErrorCode.ORDER_NOT_FOUND]: {
        code: exports.ErrorCode.ORDER_NOT_FOUND,
        message: 'Order not found',
        httpStatus: exports.HttpStatus.NOT_FOUND,
    },
    [exports.ErrorCode.ORDER_CANNOT_CANCEL]: {
        code: exports.ErrorCode.ORDER_CANNOT_CANCEL,
        message: 'Order cannot be cancelled',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.ORDER_EXPIRED]: {
        code: exports.ErrorCode.ORDER_EXPIRED,
        message: 'Order has expired',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 支付相关错误
    [exports.ErrorCode.PAYMENT_FAILED]: {
        code: exports.ErrorCode.PAYMENT_FAILED,
        message: 'Payment failed',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.PAYMENT_PENDING]: {
        code: exports.ErrorCode.PAYMENT_PENDING,
        message: 'Payment is pending',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.INSUFFICIENT_BALANCE]: {
        code: exports.ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 订阅套餐相关错误
    [exports.ErrorCode.PLAN_NOT_FOUND]: {
        code: exports.ErrorCode.PLAN_NOT_FOUND,
        message: 'Subscription plan not found',
        httpStatus: exports.HttpStatus.NOT_FOUND,
    },
    [exports.ErrorCode.PLAN_NOT_AVAILABLE]: {
        code: exports.ErrorCode.PLAN_NOT_AVAILABLE,
        message: 'Subscription plan is not available',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 节点相关错误
    [exports.ErrorCode.NODE_NOT_FOUND]: {
        code: exports.ErrorCode.NODE_NOT_FOUND,
        message: 'Node not found',
        httpStatus: exports.HttpStatus.NOT_FOUND,
    },
    [exports.ErrorCode.NODE_OFFLINE]: {
        code: exports.ErrorCode.NODE_OFFLINE,
        message: 'Node is offline',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.NODE_MAINTENANCE]: {
        code: exports.ErrorCode.NODE_MAINTENANCE,
        message: 'Node is under maintenance',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 邀请码相关错误
    [exports.ErrorCode.INVALID_INVITE_CODE]: {
        code: exports.ErrorCode.INVALID_INVITE_CODE,
        message: 'Invalid invite code',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.INVITE_CODE_USED]: {
        code: exports.ErrorCode.INVITE_CODE_USED,
        message: 'Invite code has been used',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    [exports.ErrorCode.INVITE_CODE_EXPIRED]: {
        code: exports.ErrorCode.INVITE_CODE_EXPIRED,
        message: 'Invite code has expired',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 流量相关错误
    [exports.ErrorCode.TRAFFIC_EXCEEDED]: {
        code: exports.ErrorCode.TRAFFIC_EXCEEDED,
        message: 'Traffic limit exceeded',
        httpStatus: exports.HttpStatus.FORBIDDEN,
    },
    [exports.ErrorCode.INSUFFICIENT_TRAFFIC]: {
        code: exports.ErrorCode.INSUFFICIENT_TRAFFIC,
        message: 'Insufficient traffic',
        httpStatus: exports.HttpStatus.BAD_REQUEST,
    },
    // 系统错误
    [exports.ErrorCode.DATABASE_ERROR]: {
        code: exports.ErrorCode.DATABASE_ERROR,
        message: 'Database error',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
    [exports.ErrorCode.CACHE_ERROR]: {
        code: exports.ErrorCode.CACHE_ERROR,
        message: 'Cache error',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
    [exports.ErrorCode.NETWORK_ERROR]: {
        code: exports.ErrorCode.NETWORK_ERROR,
        message: 'Network error',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
    [exports.ErrorCode.XRAY_API_ERROR]: {
        code: exports.ErrorCode.XRAY_API_ERROR,
        message: 'Xray API error',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
    [exports.ErrorCode.EMAIL_SEND_ERROR]: {
        code: exports.ErrorCode.EMAIL_SEND_ERROR,
        message: 'Failed to send email',
        httpStatus: exports.HttpStatus.INTERNAL_ERROR,
    },
};
// 根据错误码获取错误信息
function getErrorInfo(code) {
    return exports.ErrorInfoMap[code] || exports.ErrorInfoMap[exports.ErrorCode.INTERNAL_ERROR];
}
// 创建错误响应对象
function createErrorResponse(code, customMessage, errors) {
    const errorInfo = getErrorInfo(code);
    return {
        success: false,
        code,
        httpStatus: errorInfo.httpStatus,
        message: customMessage || errorInfo.message,
        ...(errors && { errors }),
        timestamp: Date.now(),
    };
}
// 错误类定义
class AppError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    constructor(message, statusCode = exports.HttpStatus.INTERNAL_ERROR, code = exports.ErrorCode.INTERNAL_ERROR, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    errors;
    constructor(message, errors) {
        super(message, exports.HttpStatus.BAD_REQUEST, exports.ErrorCode.VALIDATION_ERROR, { validationErrors: errors });
        this.name = 'ValidationError';
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=errors.js.map