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
} as const;

// Error Codes
export const ErrorCode = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
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
} as const;

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
} as const;

// Crypto Currency
export const CRYPTO_CURRENCIES = {
  BTC: 'BTC',
  ETH: 'ETH',
  USDT: 'USDT',
  BCH: 'BCH',
  LTC: 'LTC',
} as const;

// Crypto Wallet Status
export const CRYPTO_WALLET_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

// Crypto Payment Status
export const CRYPTO_PAYMENT_STATUS = {
  PENDING: 'pending',
  DETECTED: 'detected',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;

// Fiat Currencies
export const FIAT_CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  CNY: 'CNY',
  GBP: 'GBP',
  JPY: 'JPY',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  CRYPTO: 'crypto',
} as const;

// Crypto Configuration
export const CRYPTO_CONFIG = {
  WALLET_EXPIRY_MINUTES: 30,
  BTC_REQUIRED_CONFIRMATIONS: 6,
  ETH_REQUIRED_CONFIRMATIONS: 12,
  DEFAULT_CURRENCY: CRYPTO_CURRENCIES.BTC,
  DEFAULT_FIAT_CURRENCY: FIAT_CURRENCIES.USD,
  RATE_CACHE_TTL_SECONDS: 300,
} as const;
