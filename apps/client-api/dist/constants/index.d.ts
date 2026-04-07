export declare const HttpStatus: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const ErrorCode: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly CONFLICT: "CONFLICT";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly USER_INACTIVE: "USER_INACTIVE";
    readonly USER_BANNED: "USER_BANNED";
    readonly DEVICE_LIMIT_EXCEEDED: "DEVICE_LIMIT_EXCEEDED";
    readonly SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED";
    readonly TRAFFIC_EXCEEDED: "TRAFFIC_EXCEEDED";
    readonly PLAN_NOT_FOUND: "PLAN_NOT_FOUND";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_ALREADY_PAID: "ORDER_ALREADY_PAID";
    readonly NODE_NOT_FOUND: "NODE_NOT_FOUND";
    readonly INVALID_INVITE_CODE: "INVALID_INVITE_CODE";
    readonly INVITE_CODE_USED: "INVITE_CODE_USED";
    readonly INVITE_CODE_EXPIRED: "INVITE_CODE_EXPIRED";
};
export declare const DEFAULTS: {
    readonly PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly JWT_EXPIRES_IN: "15m";
    readonly JWT_REFRESH_EXPIRES_IN: "7d";
    readonly RATE_LIMIT_WINDOW_MS: 60000;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
};
export declare const USER_STATUS: {
    readonly ACTIVE: 1;
    readonly INACTIVE: 0;
    readonly BANNED: 2;
};
export declare const SUBSCRIPTION_STATUS: {
    readonly ACTIVE: 1;
    readonly INACTIVE: 0;
    readonly EXPIRED: 2;
    readonly CANCELLED: 3;
};
export declare const INVITE_CODE_STATUS: {
    readonly ACTIVE: 1;
    readonly USED: 2;
    readonly EXPIRED: 3;
};
export declare const ORDER_STATUS: {
    readonly PENDING: 1;
    readonly PAID: 2;
    readonly COMPLETED: 3;
    readonly CANCELLED: 4;
    readonly REFUNDED: 5;
};
export declare const PAYMENT_STATUS: {
    readonly PENDING: 1;
    readonly SUCCESS: 2;
    readonly FAILED: 3;
    readonly REFUNDED: 4;
};
//# sourceMappingURL=index.d.ts.map