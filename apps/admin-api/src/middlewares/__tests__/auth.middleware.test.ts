import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireRoles,
  requireSuperAdmin,
  requireAdmin,
} from '../auth';
import * as jwtUtils from '../../utils/jwt';
import { db } from '../../database';
import { UnauthorizedError, ForbiddenError, TokenExpiredError } from '../../utils/errors';

// Mock dependencies
vi.mock('../../utils/jwt');
vi.mock('../../database');

describe('Admin Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
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

  describe('authMiddleware', () => {
    it('should authenticate admin with valid token', async () => {
      // Arrange
      const mockAdmin = {
        id: 'admin-123',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true,
      };

      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const validToken = 'aat_validtoken123';
      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockAdmin),
      } as any);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(jwtUtils.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${validToken}`);
      expect(jwtUtils.isValidAccessTokenFormat).toHaveBeenCalledWith(validToken);
      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.sub).toBe('admin-123');
      expect(req.adminId).toBe('admin-123');
    });

    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      req.headers = {};
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(null);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Missing or invalid authorization header');
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 when token is missing', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer ' };
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(null);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Missing or invalid authorization header');
    });

    it('should return 401 when token format is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid_token_format';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(invalidToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(false);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Invalid token format');
    });

    it('should return 401 when token is expired', async () => {
      // Arrange
      const expiredToken = 'aat_expiredtoken';
      req.headers = { authorization: `Bearer ${expiredToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(expiredToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);

      const expiredError = new Error('Token has expired');
      expiredError.name = 'TokenExpiredError';
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw expiredError;
      });

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Token has expired');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const invalidToken = 'aat_invalidtoken';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(invalidToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);

      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw jwtError;
      });

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Invalid token');
    });

    it('should return 401 when token type is not access', async () => {
      // Arrange
      const validToken = 'aat_validtoken123';
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'refresh', // Wrong type
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Invalid token type');
    });

    it('should return 401 when admin is not found', async () => {
      // Arrange
      const validToken = 'aat_validtoken123';
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Admin account not found or inactive');
    });

    it('should return 401 when admin account is inactive (query returns null)', async () => {
      // Note: The actual middleware queries with { id: decoded.sub, is_active: true }
      // so if admin is inactive, the query returns null, not the admin object
      // Arrange
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const validToken = 'aat_validtoken123';
      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      // Database query with is_active: true filter returns null for inactive admin
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any);

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Admin account not found or inactive');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const validToken = 'aat_validtoken123';
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      vi.mocked(db).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act
      await authMiddleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should attach admin when valid token is provided', async () => {
      // Arrange
      const mockAdmin = {
        id: 'admin-123',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true,
      };

      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const validToken = 'aat_validtoken123';
      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockAdmin),
      } as any);

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.sub).toBe('admin-123');
      expect(req.adminId).toBe('admin-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without admin when no token is provided', async () => {
      // Arrange
      req.headers = {};
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(null);

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(req.adminId).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without admin when token format is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid_format';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(invalidToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(false);

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without admin when token is invalid', async () => {
      // Arrange
      const invalidToken = 'aat_invalidtoken';
      req.headers = { authorization: `Bearer ${invalidToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(invalidToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without admin when admin is not found', async () => {
      // Arrange
      const validToken = 'aat_validtoken123';
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any);

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without admin when account is inactive (query returns null)', async () => {
      // Note: The actual middleware queries with { id: decoded.sub, is_active: true }
      // so if admin is inactive, the query returns null
      // Arrange
      const mockDecoded = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const validToken = 'aat_validtoken123';
      req.headers = { authorization: `Bearer ${validToken}` };

      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue(validToken);
      vi.mocked(jwtUtils.isValidAccessTokenFormat).mockReturnValue(true);
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockDecoded as any);
      // Database query with is_active: true filter returns null for inactive admin
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any);

      // Act
      await optionalAuthMiddleware(req as Request, res as Response, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireRoles', () => {
    it('should allow access when user has required role', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'super_admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const middleware = requireRoles('super_admin', 'admin');

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access when user has one of the required roles', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const middleware = requireRoles('super_admin', 'admin');

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      req.user = undefined;

      const middleware = requireRoles('admin');

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Authentication required');
    });

    it('should return 403 when user does not have required role', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'moderator',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const middleware = requireRoles('super_admin', 'admin');

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('requireSuperAdmin', () => {
    it('should allow access for super_admin', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'super_admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Act
      requireSuperAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 403 for non-super_admin', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Act
      requireSuperAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Act
      requireAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access for super_admin', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'super_admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Act
      requireAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 403 for non-admin roles', () => {
      // Arrange
      req.user = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'moderator',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Act
      requireAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Insufficient permissions');
    });
  });
});
