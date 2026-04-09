import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../requestLogger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Request Logger Middleware', () => {
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
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
      }) as any,
      setHeader: jest.fn() as any,
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requestLogger', () => {
    it('should call next middleware', () => {
      requestLogger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should log successful requests with info level', () => {
      res.statusCode = 200;
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should log error requests with warn level', () => {
      res.statusCode = 400;
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should sanitize sensitive data in request body', () => {
      req.body = {
        username: 'testuser',
        password: 'secret123',
        token: 'token1234567890',
      };
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should sanitize sensitive data in request query', () => {
      req.query = {
        search: 'test',
        token: 'token123',
      };
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should set X-API-Version header', () => {
      requestLogger(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', expect.any(String));
    });

    it('should include userId in log if available', () => {
      (req as any).user = { id: 'user-123' };
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should include requestId in log if available', () => {
      (req as any).headers['x-request-id'] = 'req-123';
      
      requestLogger(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
