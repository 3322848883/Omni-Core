// Client API Constants

// HTTP Status Codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
} as const;

// HTTP Status Code Type
export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// Error Codes
export const ErrorCode = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',

  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  USER_BANNED: 'USER_BANNED',

  // Subscription
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  TRAFFIC_EXCEEDED: 'TRAFFIC_EXCEEDED',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',

  // Payment QR Code
  PAYMENT_QR_CODE_NOT_FOUND: 'PAYMENT_QR_CODE_NOT_FOUND',
  PAYMENT_QR_CODE_DISABLED: 'PAYMENT_QR_CODE_DISABLED',
  PAYMENT_PROOF_REQUIRED: 'PAYMENT_PROOF_REQUIRED',
  PAYMENT_PROOF_ALREADY_EXISTS: 'PAYMENT_PROOF_ALREADY_EXISTS',

  // Node
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',

  // Invite Code
  INVALID_INVITE_CODE: 'INVALID_INVITE_CODE',
  INVITE_CODE_USED: 'INVITE_CODE_USED',
  INVITE_CODE_EXPIRED: 'INVITE_CODE_EXPIRED',

  // Device
  DEVICE_LIMIT_EXCEEDED: 'DEVICE_LIMIT_EXCEEDED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Error Code Type
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// Default Values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  BANNED: 2,
} as const;

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  EXPIRED: 2,
  CANCELLED: 3,
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Payment Method
export const PAYMENT_METHOD = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  ALIPAY_MERCHANT: 'alipay_merchant',
  WECHAT_MERCHANT: 'wechat_merchant',
  ALIPAY_PERSONAL: 'alipay_personal',
  WECHAT_PERSONAL: 'wechat_personal',
} as const;

// Invite Code Status
export const INVITE_CODE_STATUS = {
  ACTIVE: 1,
  USED: 2,
  EXPIRED: 3,
} as const;

// HTTP_STATUS and ERROR_CODES for backward compatibility
export const HTTP_STATUS = HttpStatus;
export const ERROR_CODES = ErrorCode;

// Re-export from shared constants
export * from '@shared/constants';
