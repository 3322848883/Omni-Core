/**
 * Application Error Classes
 * 使用统一的错误码体系 from @shared/constants
 */
import { ErrorCodeType, HttpStatusCode } from '@/constants';
export declare class AppError extends Error {
    readonly code: ErrorCodeType;
    readonly statusCode: HttpStatusCode;
    readonly isOperational: boolean;
    readonly errors?: Array<{
        field: string;
        message: string;
    }>;
    readonly details?: Record<string, unknown>;
    constructor(code: ErrorCodeType, message: string, statusCode?: HttpStatusCode, isOperational?: boolean, errors?: Array<{
        field: string;
        message: string;
    }>, details?: Record<string, unknown>);
    toResponse(requestId?: string): {
        success: boolean;
        code: HttpStatusCode;
        message: string;
        errors: {
            field: string;
            message: string;
        }[] | undefined;
        timestamp: number;
        requestId: string;
    };
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string);
}
export declare class ValidationError extends AppError {
    constructor(errors: Array<{
        field: string;
        message: string;
    }> | string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare class BadRequestError extends AppError {
    constructor(message: string);
}
/**
 * Token expired error
 * Per api-security-specification.md, this specific error code
 * allows clients to distinguish between expired tokens and invalid tokens
 */
export declare class TokenExpiredError extends AppError {
    constructor(message?: string);
}
export declare class UserNotFoundError extends AppError {
    constructor(userId?: string);
}
export declare class UserAlreadyExistsError extends AppError {
    constructor(identifier: string);
}
export declare class InvalidCredentialsError extends AppError {
    constructor(message?: string);
}
export declare class OrderNotFoundError extends AppError {
    constructor(orderId?: string);
}
export declare class PlanNotFoundError extends AppError {
    constructor(planId?: string);
}
export declare class NodeNotFoundError extends AppError {
    constructor(nodeId?: string);
}
export declare class InviteCodeInvalidError extends AppError {
    constructor(message?: string);
}
export declare class InviteCodeUsedError extends AppError {
    constructor(message?: string);
}
export declare class InviteCodeExpiredError extends AppError {
    constructor(message?: string);
}
export declare class PaymentFailedError extends AppError {
    constructor(message?: string);
}
export declare class InsufficientBalanceError extends AppError {
    constructor(message?: string);
}
export declare class TrafficExceededError extends AppError {
    constructor(message?: string);
}
export declare class DeviceLimitExceededError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=AppError.d.ts.map