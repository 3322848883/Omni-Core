import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../auth';
import * as jwtUtils from '../../utils/jwt';
import db from '../../config/database';
import { UnauthorizedError } from '../../errors/AppError';

// Mock dependencies
jest.mock('../../utils/jwt');
jest.mock('../../config/database');

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
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

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123',
        vpn_uuid: 'vpn-uuid-123',
        status: '1',
        traffic_limit: 1000000,
        traffic_used: 0,
        expire_date: null,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };
      const validToken = 'uat_validtoken123';

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${validToken}`);
      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe('user-123');
    });

    it('should return 401 when token is missing', async () => {
      // Arrange
      req.headers = {};
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Access token required');
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      req.headers = {};
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Access token required');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const invalidToken = 'uat_invalidtoken';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(invalidToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return 401 when token is expired', async () => {
      // Arrange
      const expiredToken = 'uat_expiredtoken';
      req.headers = { authorization: `Bearer ${expiredToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(expiredToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        const error = new UnauthorizedError('Token expired');
        throw error;
      });

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return 401 when user is not found', async () => {
      // Arrange
      const validToken = 'uat_validtoken123';
      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('User not found');
    });

    it('should return 401 when user account is not active', async () => {
      // Arrange
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123',
        vpn_uuid: 'vpn-uuid-123',
        status: '0',
        traffic_limit: 1000000,
        traffic_used: 0,
        expire_date: null,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };
      const validToken = 'uat_validtoken123';

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Account is not active');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const validToken = 'uat_validtoken123';
      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act
      await authenticate(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('optionalAuth', () => {
    it('should attach user when valid token is provided', async () => {
      // Arrange
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123',
        vpn_uuid: 'vpn-uuid-123',
        status: '1',
        traffic_limit: 1000000,
        traffic_used: 0,
        expire_date: null,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };
      const validToken = 'uat_validtoken123';

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // Act
      await optionalAuth(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe('user-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when no token is provided', async () => {
      // Arrange
      req.headers = {};
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await optionalAuth(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when token is invalid', async () => {
      // Arrange
      const invalidToken = 'uat_invalidtoken';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(invalidToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuth(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when user is not found', async () => {
      // Arrange
      const validToken = 'uat_validtoken123';
      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      await optionalAuth(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when account is inactive', async () => {
      // Arrange
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123',
        vpn_uuid: 'vpn-uuid-123',
        status: '0',
        traffic_limit: 1000000,
        traffic_used: 0,
        expire_date: null,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const mockDecoded = { userId: 'user-123', email: 'test@example.com' };
      const validToken = 'uat_validtoken123';

      req.headers = { authorization: `Bearer ${validToken}` };

      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(validToken);
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded as any);
      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // Act
      await optionalAuth(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
