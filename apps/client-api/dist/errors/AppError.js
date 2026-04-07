"use strict";
/**
 * Application Error Classes
 * 使用统一的错误码体系 from @shared/constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.DeviceLimitExceededError = exports.TrafficExceededError = exports.InsufficientBalanceError = exports.PaymentFailedError = exports.InviteCodeExpiredError = exports.InviteCodeUsedError = exports.InviteCodeInvalidError = exports.NodeNotFoundError = exports.PlanNotFoundError = exports.OrderNotFoundError = exports.InvalidCredentialsError = exports.UserAlreadyExistsError = exports.UserNotFoundError = exports.TokenExpiredError = exports.BadRequestError = exports.TooManyRequestsError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
const constants_1 = require("@/constants");
class AppError extends Error {
    code;
    statusCode;
    isOperational;
    errors;
    details;
    constructor(code, message, statusCode, isOperational = true, errors, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode || constants_1.HttpStatus.INTERNAL_ERROR;
        this.isOperational = isOperational;
        this.errors = errors;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    toResponse(requestId) {
        return {
            success: false,
            code: this.statusCode,
            message: this.message,
            errors: this.errors,
            timestamp: Date.now(),
            requestId: requestId || '',
        };
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with id '${identifier}' not found`
            : `${resource} not found`;
        super(constants_1.ErrorCode.NOT_FOUND, message, constants_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(errors) {
        if (typeof errors === 'string') {
            super(constants_1.ErrorCode.VALIDATION_ERROR, errors, constants_1.HttpStatus.BAD_REQUEST, true, [
                { field: 'general', message: errors },
            ]);
        }
        else {
            super(constants_1.ErrorCode.VALIDATION_ERROR, 'Validation failed', constants_1.HttpStatus.BAD_REQUEST, true, errors);
        }
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(constants_1.ErrorCode.UNAUTHORIZED, message, constants_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(constants_1.ErrorCode.FORBIDDEN, message, constants_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message) {
        super(constants_1.ErrorCode.CONFLICT, message, constants_1.HttpStatus.CONFLICT);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(constants_1.ErrorCode.RATE_LIMITED, message, constants_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class BadRequestError extends AppError {
    constructor(message) {
        super(constants_1.ErrorCode.BAD_REQUEST, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Token expired error
 * Per api-security-specification.md, this specific error code
 * allows clients to distinguish between expired tokens and invalid tokens
 */
class TokenExpiredError extends AppError {
    constructor(message = 'Token has expired') {
        super(constants_1.ErrorCode.TOKEN_EXPIRED, message, constants_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class UserNotFoundError extends AppError {
    constructor(userId) {
        const message = userId ? `User with id '${userId}' not found` : 'User not found';
        super(constants_1.ErrorCode.USER_NOT_FOUND, message, constants_1.HttpStatus.NOT_FOUND);
    }
}
exports.UserNotFoundError = UserNotFoundError;
class UserAlreadyExistsError extends AppError {
    constructor(identifier) {
        super(constants_1.ErrorCode.USER_ALREADY_EXISTS, `User '${identifier}' already exists`, constants_1.HttpStatus.CONFLICT);
    }
}
exports.UserAlreadyExistsError = UserAlreadyExistsError;
class InvalidCredentialsError extends AppError {
    constructor(message = 'Invalid credentials') {
        super(constants_1.ErrorCode.INVALID_CREDENTIALS, message, constants_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class OrderNotFoundError extends AppError {
    constructor(orderId) {
        const message = orderId ? `Order with id '${orderId}' not found` : 'Order not found';
        super(constants_1.ErrorCode.ORDER_NOT_FOUND, message, constants_1.HttpStatus.NOT_FOUND);
    }
}
exports.OrderNotFoundError = OrderNotFoundError;
class PlanNotFoundError extends AppError {
    constructor(planId) {
        const message = planId ? `Plan with id '${planId}' not found` : 'Plan not found';
        super(constants_1.ErrorCode.PLAN_NOT_FOUND, message, constants_1.HttpStatus.NOT_FOUND);
    }
}
exports.PlanNotFoundError = PlanNotFoundError;
class NodeNotFoundError extends AppError {
    constructor(nodeId) {
        const message = nodeId ? `Node with id '${nodeId}' not found` : 'Node not found';
        super(constants_1.ErrorCode.NODE_NOT_FOUND, message, constants_1.HttpStatus.NOT_FOUND);
    }
}
exports.NodeNotFoundError = NodeNotFoundError;
class InviteCodeInvalidError extends AppError {
    constructor(message = 'Invalid invite code') {
        super(constants_1.ErrorCode.INVALID_INVITE_CODE, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InviteCodeInvalidError = InviteCodeInvalidError;
class InviteCodeUsedError extends AppError {
    constructor(message = 'Invite code has been used') {
        super(constants_1.ErrorCode.INVITE_CODE_USED, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InviteCodeUsedError = InviteCodeUsedError;
class InviteCodeExpiredError extends AppError {
    constructor(message = 'Invite code has expired') {
        super(constants_1.ErrorCode.INVITE_CODE_EXPIRED, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InviteCodeExpiredError = InviteCodeExpiredError;
class PaymentFailedError extends AppError {
    constructor(message = 'Payment failed') {
        super(constants_1.ErrorCode.PAYMENT_FAILED, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.PaymentFailedError = PaymentFailedError;
class InsufficientBalanceError extends AppError {
    constructor(message = 'Insufficient balance') {
        super(constants_1.ErrorCode.INSUFFICIENT_BALANCE, message, constants_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
class TrafficExceededError extends AppError {
    constructor(message = 'Traffic limit exceeded') {
        super(constants_1.ErrorCode.TRAFFIC_EXCEEDED, message, constants_1.HttpStatus.FORBIDDEN);
    }
}
exports.TrafficExceededError = TrafficExceededError;
class DeviceLimitExceededError extends AppError {
    constructor(message = 'Device limit exceeded') {
        super(constants_1.ErrorCode.DEVICE_LIMIT_EXCEEDED, message, constants_1.HttpStatus.FORBIDDEN);
    }
}
exports.DeviceLimitExceededError = DeviceLimitExceededError;
class DatabaseError extends AppError {
    constructor(message = 'Database error') {
        super(constants_1.ErrorCode.DATABASE_ERROR, message, constants_1.HttpStatus.INTERNAL_ERROR, false);
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=AppError.js.map