import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus } from '@/constants';
import logger from '@/utils/logger';
import { createRequestId } from '@/utils/response';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || createRequestId();

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId,
  });

  // Handle AppError and its subclasses
  if (err instanceof AppError) {
    res.status(err.statusCode || HttpStatus.INTERNAL_ERROR).json({
      success: false,
      code: err.code || ErrorCode.INTERNAL_ERROR,
      message: err.message,
      errors: err.errors,
      requestId,
      timestamp: Date.now(),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      code: HttpStatus.UNAUTHORIZED,
      message: 'Invalid token',
      errors: [{
        field: 'token',
        message: 'Invalid token',
      }],
      requestId,
      timestamp: Date.now(),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      code: HttpStatus.UNAUTHORIZED,
      message: 'Token expired',
      errors: [{
        field: 'token',
        message: 'Token has expired',
      }],
      requestId,
      timestamp: Date.now(),
    });
    return;
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(HttpStatus.INTERNAL_ERROR).json({
    success: false,
    code: HttpStatus.INTERNAL_ERROR,
    message: isDevelopment ? err.message : 'Internal server error',
    errors: isDevelopment ? [{
      field: 'general',
      message: err.message,
    }] : undefined,
    requestId,
    timestamp: Date.now(),
  });
};
