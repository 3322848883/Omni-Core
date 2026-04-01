/**
 * FGVPN Unified Error Code System
 * 统一的错误码体系，用于 admin-api 和 client-api
 *
 * 错误码格式：大写下划线分隔（如 VALIDATION_ERROR）
 * 每个错误码包含：code, message, httpStatus
 */

// HTTP 状态码映射
export const HttpStatus = {
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
} as const;

// HTTP 状态码类型
export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// 业务错误码定义
export const ErrorCode = {
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
} as const;

// 错误码类型
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// 错误信息接口
export interface ErrorInfo {
  code: ErrorCodeType;
  message: string;
  httpStatus: HttpStatusCode;
}

// 错误信息映射表
export const ErrorInfoMap: Record<ErrorCodeType, ErrorInfo> = {
  // 通用错误
  [ErrorCode.BAD_REQUEST]: {
    code: ErrorCode.BAD_REQUEST,
    message: 'Bad request',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHORIZED,
    message: 'Unauthorized',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: 'Forbidden',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.NOT_FOUND]: {
    code: ErrorCode.NOT_FOUND,
    message: 'Resource not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.CONFLICT]: {
    code: ErrorCode.CONFLICT,
    message: 'Resource conflict',
    httpStatus: HttpStatus.CONFLICT,
  },
  [ErrorCode.RATE_LIMITED]: {
    code: ErrorCode.RATE_LIMITED,
    message: 'Too many requests',
    httpStatus: HttpStatus.RATE_LIMITED,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },

  // 认证相关错误
  [ErrorCode.TOKEN_EXPIRED]: {
    code: ErrorCode.TOKEN_EXPIRED,
    message: 'Token has expired',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.TOKEN_INVALID]: {
    code: ErrorCode.TOKEN_INVALID,
    message: 'Invalid token',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.TOKEN_REVOKED]: {
    code: ErrorCode.TOKEN_REVOKED,
    message: 'Token has been revoked',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    code: ErrorCode.INVALID_CREDENTIALS,
    message: 'Invalid credentials',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.DEVICE_LIMIT_EXCEEDED]: {
    code: ErrorCode.DEVICE_LIMIT_EXCEEDED,
    message: 'Device limit exceeded',
    httpStatus: HttpStatus.FORBIDDEN,
  },

  // 用户相关错误
  [ErrorCode.USER_NOT_FOUND]: {
    code: ErrorCode.USER_NOT_FOUND,
    message: 'User not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.USER_ALREADY_EXISTS]: {
    code: ErrorCode.USER_ALREADY_EXISTS,
    message: 'User already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  [ErrorCode.USER_DISABLED]: {
    code: ErrorCode.USER_DISABLED,
    message: 'Account has been disabled',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.USER_BANNED]: {
    code: ErrorCode.USER_BANNED,
    message: 'Account has been banned',
    httpStatus: HttpStatus.FORBIDDEN,
  },

  // 订单相关错误
  [ErrorCode.ORDER_NOT_FOUND]: {
    code: ErrorCode.ORDER_NOT_FOUND,
    message: 'Order not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.ORDER_CANNOT_CANCEL]: {
    code: ErrorCode.ORDER_CANNOT_CANCEL,
    message: 'Order cannot be cancelled',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.ORDER_EXPIRED]: {
    code: ErrorCode.ORDER_EXPIRED,
    message: 'Order has expired',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 支付相关错误
  [ErrorCode.PAYMENT_FAILED]: {
    code: ErrorCode.PAYMENT_FAILED,
    message: 'Payment failed',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.PAYMENT_PENDING]: {
    code: ErrorCode.PAYMENT_PENDING,
    message: 'Payment is pending',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INSUFFICIENT_BALANCE]: {
    code: ErrorCode.INSUFFICIENT_BALANCE,
    message: 'Insufficient balance',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 订阅套餐相关错误
  [ErrorCode.PLAN_NOT_FOUND]: {
    code: ErrorCode.PLAN_NOT_FOUND,
    message: 'Subscription plan not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.PLAN_NOT_AVAILABLE]: {
    code: ErrorCode.PLAN_NOT_AVAILABLE,
    message: 'Subscription plan is not available',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 节点相关错误
  [ErrorCode.NODE_NOT_FOUND]: {
    code: ErrorCode.NODE_NOT_FOUND,
    message: 'Node not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.NODE_OFFLINE]: {
    code: ErrorCode.NODE_OFFLINE,
    message: 'Node is offline',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.NODE_MAINTENANCE]: {
    code: ErrorCode.NODE_MAINTENANCE,
    message: 'Node is under maintenance',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 邀请码相关错误
  [ErrorCode.INVALID_INVITE_CODE]: {
    code: ErrorCode.INVALID_INVITE_CODE,
    message: 'Invalid invite code',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INVITE_CODE_USED]: {
    code: ErrorCode.INVITE_CODE_USED,
    message: 'Invite code has been used',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INVITE_CODE_EXPIRED]: {
    code: ErrorCode.INVITE_CODE_EXPIRED,
    message: 'Invite code has expired',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 流量相关错误
  [ErrorCode.TRAFFIC_EXCEEDED]: {
    code: ErrorCode.TRAFFIC_EXCEEDED,
    message: 'Traffic limit exceeded',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.INSUFFICIENT_TRAFFIC]: {
    code: ErrorCode.INSUFFICIENT_TRAFFIC,
    message: 'Insufficient traffic',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // 系统错误
  [ErrorCode.DATABASE_ERROR]: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'Database error',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },
  [ErrorCode.CACHE_ERROR]: {
    code: ErrorCode.CACHE_ERROR,
    message: 'Cache error',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    message: 'Network error',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },
  [ErrorCode.XRAY_API_ERROR]: {
    code: ErrorCode.XRAY_API_ERROR,
    message: 'Xray API error',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },
  [ErrorCode.EMAIL_SEND_ERROR]: {
    code: ErrorCode.EMAIL_SEND_ERROR,
    message: 'Failed to send email',
    httpStatus: HttpStatus.INTERNAL_ERROR,
  },
};

// 根据错误码获取错误信息
export function getErrorInfo(code: ErrorCodeType): ErrorInfo {
  return ErrorInfoMap[code] || ErrorInfoMap[ErrorCode.INTERNAL_ERROR];
}

// 创建错误响应对象
export function createErrorResponse(
  code: ErrorCodeType,
  customMessage?: string,
  errors?: Array<{ field: string; message: string }>
): {
  success: false;
  code: ErrorCodeType;
  httpStatus: HttpStatusCode;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: number;
} {
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

// 为了保持向后兼容，导出旧名称
export { ErrorCode as ERROR_CODES };
export { HttpStatus as HTTP_STATUS };

// 错误类定义
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_ERROR,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors?: Array<{ field: string; message: string }>;

  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, { validationErrors: errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
