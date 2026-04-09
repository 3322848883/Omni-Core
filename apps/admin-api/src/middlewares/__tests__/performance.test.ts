import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  requestTimer,
  cacheControl,
  queryOptimizer,
  batchOptimizer,
} from '../performance';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Performance Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      query: {},
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

  describe('requestTimer', () => {
    it('should call next middleware', () => {
      const timer = requestTimer();
      timer(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should set request ID on request object', () => {
      const timer = requestTimer();
      timer(req as Request, res as Response, next);

      expect((req as any).requestId).toBeDefined();
    });

    it('should use provided request ID from headers if available', () => {
      (req as any).headers['x-request-id'] = 'custom-request-id-123';
      
      const timer = requestTimer();
      timer(req as Request, res as Response, next);

      expect((req as any).requestId).toBe('custom-request-id-123');
    });

    it('should set X-Response-Time and X-Request-ID headers', () => {
      const timer = requestTimer();
      timer(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringContaining('ms')
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.any(String)
      );
    });

    it('should log slow queries when enabled', () => {
      const timer = requestTimer({
        slowQueryThreshold: 100,
        enableLogging: true,
      });
      
      timer(req as Request, res as Response, next);

      const { logger } = require('../../utils/logger');
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe('cacheControl', () => {
    it('should set default API cache control headers', () => {
      const cache = cacheControl();
      cache(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('no-cache')
      );
      expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Expires', '0');
    });

    it('should set static cache control headers', () => {
      const cache = cacheControl('static');
      cache(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('max-age')
      );
    });

    it('should set dynamic cache control headers', () => {
      const cache = cacheControl('dynamic');
      cache(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('queryOptimizer', () => {
    it('should call next middleware', () => {
      queryOptimizer(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should set default page and limit when not provided', () => {
      req.query = {};
      
      queryOptimizer(req as Request, res as Response, next);

      expect(req.query.page).toBe('1');
      expect(req.query.limit).toBe('20');
    });

    it('should limit maximum page size to 100', () => {
      req.query = { limit: '200' };
      
      queryOptimizer(req as Request, res as Response, next);

      expect(req.query.limit).toBe('100');
    });

    it('should validate and correct invalid page values', () => {
      req.query = { page: '-1', limit: '0' };
      
      queryOptimizer(req as Request, res as Response, next);

      expect(req.query.page).toBe('1');
      expect(req.query.limit).toBe('20');
    });
  });

  describe('batchOptimizer', () => {
    it('should chunk array into specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const optimizer = batchOptimizer(3);
      
      const chunks = optimizer.chunk(array);
      
      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toEqual([1, 2, 3]);
      expect(chunks[3]).toEqual([10]);
    });

    it('should handle empty array', () => {
      const optimizer = batchOptimizer(100);
      
      const chunks = optimizer.chunk([]);
      
      expect(chunks).toHaveLength(0);
    });

    it('should execute batch insert successfully', async () => {
      const records = [1, 2, 3, 4, 5];
      const insertFn = jest.fn().mockImplementation(() => Promise.resolve(true)) as any;
      const optimizer = batchOptimizer(2);
      
      const result = await optimizer.batchInsert('test_table', records, insertFn);
      
      expect(insertFn).toHaveBeenCalled();
      expect(result.success).toBe(5);
      expect(result.failed).toBe(0);
    });
  });
});
