/**
 * FGVPN Unified Error Code System
 * 统一的错误码体系，用于 admin-api 和 client-api
 *
 * 错误码格式：大写下划线分隔（如 VALIDATION_ERROR）
 * 每个错误码包含：code, message, httpStatus
 */
export declare const HttpStatus: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly RATE_LIMITED: 429;
    readonly INTERNAL_ERROR: 500;
};
export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];
export declare const ErrorCode: {
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly TOKEN_REVOKED: "TOKEN_REVOKED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly DEVICE_LIMIT_EXCEEDED: "DEVICE_LIMIT_EXCEEDED";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly USER_DISABLED: "USER_DISABLED";
    readonly USER_BANNED: "USER_BANNED";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_CANNOT_CANCEL: "ORDER_CANNOT_CANCEL";
    readonly ORDER_EXPIRED: "ORDER_EXPIRED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PAYMENT_PENDING: "PAYMENT_PENDING";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly PLAN_NOT_FOUND: "PLAN_NOT_FOUND";
    readonly PLAN_NOT_AVAILABLE: "PLAN_NOT_AVAILABLE";
    readonly NODE_NOT_FOUND: "NODE_NOT_FOUND";
    readonly NODE_OFFLINE: "NODE_OFFLINE";
    readonly NODE_MAINTENANCE: "NODE_MAINTENANCE";
    readonly INVALID_INVITE_CODE: "INVALID_INVITE_CODE";
    readonly INVITE_CODE_USED: "INVITE_CODE_USED";
    readonly INVITE_CODE_EXPIRED: "INVITE_CODE_EXPIRED";
    readonly TRAFFIC_EXCEEDED: "TRAFFIC_EXCEEDED";
    readonly INSUFFICIENT_TRAFFIC: "INSUFFICIENT_TRAFFIC";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly CACHE_ERROR: "CACHE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly XRAY_API_ERROR: "XRAY_API_ERROR";
    readonly EMAIL_SEND_ERROR: "EMAIL_SEND_ERROR";
};
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
export interface ErrorInfo {
    code: ErrorCodeType;
    message: string;
    httpStatus: HttpStatusCode;
}
export declare const ErrorInfoMap: Record<ErrorCodeType, ErrorInfo>;
export declare function getErrorInfo(code: ErrorCodeType): ErrorInfo;
export declare function createErrorResponse(code: ErrorCodeType, customMessage?: string, errors?: Array<{
    field: string;
    message: string;
}>): {
    success: false;
    code: ErrorCodeType;
    httpStatus: HttpStatusCode;
    message: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
    timestamp: number;
};
export { ErrorCode as ERROR_CODES };
export { HttpStatus as HTTP_STATUS };
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: Record<string, unknown>);
}
export declare class ValidationError extends AppError {
    errors?: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, errors?: Array<{
        field: string;
        message: string;
    }>);
}
//# sourceMappingURL=errors.d.ts.map