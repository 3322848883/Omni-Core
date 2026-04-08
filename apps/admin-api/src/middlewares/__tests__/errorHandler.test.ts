import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const vi = jest;
import { Request, Response, NextFunction } from 'express';
import { errorHandler, createError } from '../errorHandler';
import { AppError, ValidationError } from '../../utils/errors';
import { HttpStatus } from '@shared/constants';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Error Handler Middleware', () => {
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
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('Test AppError', HttpStatus.BAD_REQUEST);
      
      errorHandler(appError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Test AppError',
      }));
    });

    it('should handle ValidationError correctly', () => {
      const validationError = new ValidationError([
        { field: 'email', message: 'Invalid email' },
      ]);
      
      errorHandler(validationError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        errors: [{ field: 'email', message: 'Invalid email' }],
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

    it('should handle generic errors correctly', () => {
      const genericError = new Error('Something went wrong');
      
      errorHandler(genericError, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_ERROR);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Something went wrong',
      }));
    });

    it('should redact sensitive data in request body when logging', () => {
      req.body = {
        password: 'secret123',
        token: 'token123',
        username: 'testuser',
      };
      
      const appError = new AppError('Test error', HttpStatus.BAD_REQUEST);
      
      errorHandler(appError, req as Request, res as Response, next);
      
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createError', () => {
    it('should create error with default status code', () => {
      const error = createError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
    });

    it('should create error with custom status code', () => {
      const error = createError('Not found', HttpStatus.NOT_FOUND);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should create error with details', () => {
      const details = { field: 'test' };
      const error = createError('Validation error', HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
      
      expect(error.message).toBe('Validation error');
      expect(error.details).toEqual(details);
    });
  });
});
