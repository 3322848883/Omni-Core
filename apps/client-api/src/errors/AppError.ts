/**
 * Application Error Classes
 * 使用统一的错误码体系 from @shared/constants
 */

import { ErrorCode, HttpStatus, ErrorCodeType, HttpStatusCode } from '../constants';

import { ErrorCodeType as SharedErrorCodeType, HttpStatusCode as SharedHttpStatusCode } from '../constants';

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCodeType,
    message: string,
    statusCode?: HttpStatusCode,
    isOperational: boolean = true,
    errors?: Array<{ field: string; message: string }>,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode || HttpStatus.INTERNAL_ERROR;
    this.isOperational = isOperational;
    this.errors = errors;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Array<{ field: string; message: string }>): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, HttpStatus.BAD_REQUEST, true, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, false);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN, false);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND, false);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_ERROR, false);
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT, false);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(ErrorCode.TOO_MANY_REQUESTS, message, HttpStatus.TOO_MANY_REQUESTS, false);
  }

  static validationError(message: string, errors?: Array<{ field: string; message: string }>): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, true, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, true, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, false);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN, false);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND, false);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT, false);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_ERROR, false);
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string = 'Payment failed') {
    super(ErrorCode.PAYMENT_FAILED, message, HttpStatus.BAD_REQUEST, false);
  }
}

export class OrderNotFoundError extends AppError {
  constructor(message: string = 'Order not found') {
    super(ErrorCode.ORDER_NOT_FOUND, message, HttpStatus.NOT_FOUND, false);
  }
}

export class OrderAlreadyPaidError extends AppError {
  constructor(message: string = 'Order already paid') {
    super(ErrorCode.ORDER_ALREADY_PAID, message, HttpStatus.CONFLICT, false);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found') {
    super(ErrorCode.USER_NOT_FOUND, message, HttpStatus.NOT_FOUND, false);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = 'User already exists') {
    super(ErrorCode.USER_ALREADY_EXISTS, message, HttpStatus.CONFLICT, false);
  }
}

export class UserInactiveError extends AppError {
  constructor(message: string = 'User is inactive') {
    super(ErrorCode.USER_INACTIVE, message, HttpStatus.FORBIDDEN, false);
  }
}

export class UserBannedError extends AppError {
  constructor(message: string = 'User is banned') {
    super(ErrorCode.USER_BANNED, message, HttpStatus.FORBIDDEN, false);
  }
}

export class SubscriptionExpiredError extends AppError {
  constructor(message: string = 'Subscription has expired') {
    super(ErrorCode.SUBSCRIPTION_EXPIRED, message, HttpStatus.FORBIDDEN, false);
  }
}

export class TrafficExceededError extends AppError {
  constructor(message: string = 'Traffic limit exceeded') {
    super(ErrorCode.TRAFFIC_EXCEEDED, message, HttpStatus.FORBIDDEN, false);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED, false);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(ErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED, false);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(ErrorCode.TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED, false);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.INSUFFICIENT_PERMISSIONS, message, HttpStatus.FORBIDDEN, false);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(ErrorCode.TOO_MANY_REQUESTS, message, HttpStatus.TOO_MANY_REQUESTS, false);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(ErrorCode.DATABASE_ERROR, message, HttpStatus.INTERNAL_ERROR, false);
  }
}
