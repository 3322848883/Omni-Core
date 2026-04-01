import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createRequestId } from '../utils/response';
import { ErrorCode, HttpStatus } from '@shared/constants';
import { AppError, ValidationError } from '../utils/errors';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
  errors?: Array<{ field: string; message: string }>;
}

export const errorHandler = (
  err: ApiError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = createRequestId();

  // Handle AppError/ValidationError instances
  if (err && (err.name === 'AppError' || err.name === 'ValidationError')) {
    const statusCode = err.statusCode || HttpStatus.INTERNAL_ERROR;
    const errorCode = err.code || ErrorCode.INTERNAL_ERROR;
    const message = err.message || 'Internal server error';

    // Log error with request ID
    logger.error({
      message: 'API Error',
      error: {
        code: errorCode,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: redactSensitiveBody(req.body),
        headers: redactSensitiveHeaders(req.headers),
        ip: req.ip,
      },
      requestId,
    });

    // Build response
    const response: Record<string, unknown> = {
      success: false,
      code: statusCode,
      message: process.env.NODE_ENV === 'production' && statusCode === HttpStatus.INTERNAL_ERROR
        ? 'Internal server error'
        : message,
      timestamp: Date.now(),
      requestId,
    };

    // Add validation errors if present
    if (err.name === 'ValidationError' && err.errors) {
      response.errors = err.errors;
    }

    res.status(statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.error({
      message: 'JWT Error',
      error: err.message,
      requestId,
    });

    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      code: HttpStatus.UNAUTHORIZED,
      message: 'Invalid token',
      errors: [{
        field: 'token',
        message: 'Invalid token',
      }],
      timestamp: Date.now(),
      requestId,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    logger.error({
      message: 'JWT Token Expired',
      error: err.message,
      requestId,
    });

    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      code: HttpStatus.UNAUTHORIZED,
      message: 'Token expired',
      errors: [{
        field: 'token',
        message: 'Token has expired',
      }],
      timestamp: Date.now(),
      requestId,
    });
    return;
  }

  // Handle generic errors
  const statusCode = err.statusCode || HttpStatus.INTERNAL_ERROR;
  const errorCode = err.code || ErrorCode.INTERNAL_ERROR;
  const message = err.message || 'Internal server error';

  // Log error
  logger.error({
    message: 'API Error',
    error: {
      code: errorCode,
      message: err.message,
      stack: err.stack,
      details: err.details,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: redactSensitiveBody(req.body),
      headers: redactSensitiveHeaders(req.headers),
      ip: req.ip,
    },
    requestId,
  });

  // Send response
  const response: Record<string, unknown> = {
    success: false,
    code: statusCode,
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : message,
    timestamp: Date.now(),
    requestId,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

/**
 * Redact sensitive fields from request body for logging
 */
function redactSensitiveBody(body: Record<string, unknown>): Record<string, unknown> | string {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'passwordHash', 'mfaCode', 'token', 'refreshToken', 'secret'];
  const redacted = { ...body };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '***REDACTED***';
    }
  }

  return redacted;
}

/**
 * Redact sensitive headers for logging
 */
function redactSensitiveHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const redacted = { ...headers };

  for (const header of sensitiveHeaders) {
    if (header in redacted) {
      redacted[header] = '***REDACTED***';
    }
  }

  return redacted;
}

export const createError = (
  message: string,
  statusCode: number = HttpStatus.INTERNAL_ERROR,
  code: string = ErrorCode.INTERNAL_ERROR,
  details?: Record<string, unknown>
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};
