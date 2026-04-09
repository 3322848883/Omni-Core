/**
 * Application Error Classes
 * 使用统一的错误码体系 from @shared/constants
 */

import { ErrorCode, HttpStatus } from '@/constants';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode?: number,
    isOperational: boolean = true,
    errors?: Array<{ field: string; message: string }>,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || HttpStatus.INTERNAL_ERROR;
    this.isOperational = isOperational;
    this.errors = errors;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(requestId?: string) {
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

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }> | string) {
    if (typeof errors === 'string') {
      super(ErrorCode.VALIDATION_ERROR, errors, HttpStatus.BAD_REQUEST, true, [
        { field: 'general', message: errors },
      ]);
    } else {
      super(ErrorCode.VALIDATION_ERROR, 'Validation failed', HttpStatus.BAD_REQUEST, true, errors);
    }
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(ErrorCode.RATE_LIMITED, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(ErrorCode.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Token expired error
 * Per api-security-specification.md, this specific error code
 * allows clients to distinguish between expired tokens and invalid tokens
 */
export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(ErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class UserNotFoundError extends AppError {
  constructor(userId?: string) {
    const message = userId ? `User with id '${userId}' not found` : 'User not found';
    super(ErrorCode.USER_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(identifier: string) {
    super(ErrorCode.USER_ALREADY_EXISTS, `User '${identifier}' already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class OrderNotFoundError extends AppError {
  constructor(orderId?: string) {
    const message = orderId ? `Order with id '${orderId}' not found` : 'Order not found';
    super(ErrorCode.ORDER_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class PlanNotFoundError extends AppError {
  constructor(planId?: string) {
    const message = planId ? `Plan with id '${planId}' not found` : 'Plan not found';
    super(ErrorCode.PLAN_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class NodeNotFoundError extends AppError {
  constructor(nodeId?: string) {
    const message = nodeId ? `Node with id '${nodeId}' not found` : 'Node not found';
    super(ErrorCode.NODE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class InviteCodeInvalidError extends AppError {
  constructor(message: string = 'Invalid invite code') {
    super(ErrorCode.INVALID_INVITE_CODE, message, HttpStatus.BAD_REQUEST);
  }
}

export class InviteCodeUsedError extends AppError {
  constructor(message: string = 'Invite code has been used') {
    super(ErrorCode.INVITE_CODE_USED, message, HttpStatus.BAD_REQUEST);
  }
}

export class InviteCodeExpiredError extends AppError {
  constructor(message: string = 'Invite code has expired') {
    super(ErrorCode.INVITE_CODE_EXPIRED, message, HttpStatus.BAD_REQUEST);
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string = 'Payment failed') {
    super(ErrorCode.PAYMENT_FAILED, message, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message: string = 'Insufficient balance') {
    super(ErrorCode.INSUFFICIENT_BALANCE, message, HttpStatus.BAD_REQUEST);
  }
}

export class TrafficExceededError extends AppError {
  constructor(message: string = 'Traffic limit exceeded') {
    super(ErrorCode.TRAFFIC_EXCEEDED, message, HttpStatus.FORBIDDEN);
  }
}

export class DeviceLimitExceededError extends AppError {
  constructor(message: string = 'Device limit exceeded') {
    super(ErrorCode.DEVICE_LIMIT_EXCEEDED, message, HttpStatus.FORBIDDEN);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(ErrorCode.DATABASE_ERROR, message, HttpStatus.INTERNAL_ERROR, false);
  }
}
