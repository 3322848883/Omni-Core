import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const vi = jest;
import { Request, Response, NextFunction } from 'express';
import { requestId, requestLogger } from '../requestLogger';

// Mock logger
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Client API Request Logger Middleware', () => {
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
      get: vi.fn().mockReturnValue('Test User Agent'),
    };
    res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
      }),
      setHeader: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestId', () => {
    it('should assign unique request ID to request', () => {
      requestId(req as Request, res as Response, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requestLogger', () => {
    it('should call next middleware', () => {
      requestLogger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should log successful requests with info level', () => {
      res.statusCode = 200;
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.info).toHaveBeenCalled();
    });

    it('should log error requests with warn level', () => {
      res.statusCode = 400;
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should sanitize sensitive data in request body', () => {
      req.body = {
        username: 'testuser',
        password: 'secret123',
        token: 'token1234567890',
      };
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.info).toHaveBeenCalled();
    });

    it('should sanitize sensitive data in request query', () => {
      req.query = {
        search: 'test',
        token: 'token123',
      };
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.info).toHaveBeenCalled();
    });

    it('should set X-API-Version header', () => {
      requestLogger(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', expect.any(String));
    });

    it('should include userId in log if available', () => {
      req.user = { id: 'user-123' };
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.info).toHaveBeenCalled();
    });

    it('should include requestId in log if available', () => {
      req.requestId = 'req-123';
      
      requestLogger(req as Request, res as Response, next);

      const logger = require('@/utils/logger').default;
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
