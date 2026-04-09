import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';
import { AppError } from '@/errors/AppError';
import { HttpStatus } from '@/constants';

// Mock logger
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: logger,
  };
});

// Mock response util
jest.mock('@/utils/response', () => ({
  createRequestId: jest.fn().mockReturnValue('test-request-id-123'),
}));

describe('Client API Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      query: {},
      body: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent') as any,
    };
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('BAD_REQUEST', 'Test AppError', HttpStatus.BAD_REQUEST);
      
      errorHandler(appError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Test AppError',
      }));
    });

    it('should handle JsonWebTokenError correctly', () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      
      errorHandler(jwtError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid token',
      }));
    });

    it('should handle TokenExpiredError correctly', () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      
      errorHandler(expiredError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Token expired',
      }));
    });

    it('should handle generic errors in development mode', () => {
      process.env.NODE_ENV = 'development';
      const genericError = new Error('Something went wrong');
      
      errorHandler(genericError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_ERROR);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Something went wrong',
      }));
    });

    it('should handle generic errors in production mode', () => {
      process.env.NODE_ENV = 'production';
      const genericError = new Error('Something went wrong');
      
      errorHandler(genericError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_ERROR);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Internal server error',
      }));
    });

    it('should use requestId from request if available', () => {
      req.requestId = 'custom-request-id-456';
      const appError = new AppError('BAD_REQUEST', 'Test error', HttpStatus.BAD_REQUEST);
      
      errorHandler(appError, req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        requestId: 'custom-request-id-456',
      }));
    });
  });
});
