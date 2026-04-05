import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { db } from '../database';
import { logger } from '../utils/logger';
import { sendSuccess } from '../utils/response';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  isValidRefreshTokenFormat,
} from '../utils/jwt';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth';
import { validate, AuthValidation } from '../middlewares/validation';
import { config } from '../config';

const router = Router();

/**
 * Admin user interface
 */
interface AdminUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  avatar: string | null;
  is_active: boolean;
  mfa_secret: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Login request body
 */
interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
}

/**
 * Token response
 */
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * POST /api/v1/auth/login - Admin login
 * Supports username/password authentication with optional MFA
 */
router.post(
  '/login',
  validate(AuthValidation.login),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, mfaCode } = req.body as LoginRequest;

      // Find admin by username
      const admin = await db<AdminUser>('admin_users')
        .where({ username })
        .first();

      if (!admin) {
        // Log failed login attempt
        logger.warn({
          message: 'Failed login attempt - user not found',
          username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        throw new UnauthorizedError('Invalid username or password');
      }

      // Check if account is active
      if (!admin.is_active) {
        logger.warn({
          message: 'Failed login attempt - account inactive',
          username,
          adminId: admin.id,
          ip: req.ip,
        });
        throw new ForbiddenError('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

      if (!isPasswordValid) {
        // Log failed login attempt
        logger.warn({
          message: 'Failed login attempt - invalid password',
          username,
          adminId: admin.id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        throw new UnauthorizedError('Invalid username or password');
      }

      // Check MFA if enabled
      if (admin.mfa_secret) {
        if (!mfaCode) {
          throw new ValidationError('Validation failed', [
            { field: 'mfaCode', message: 'MFA code is required' },
          ]);
        }

        const isMfaValid = speakeasy.totp.verify({
          secret: admin.mfa_secret,
          encoding: 'base32',
          token: mfaCode,
          window: 1,
        });

        if (!isMfaValid) {
          logger.warn({
            message: 'Failed login attempt - invalid MFA code',
            username,
            adminId: admin.id,
            ip: req.ip,
          });
          throw new UnauthorizedError('Invalid MFA code');
        }
      }

      // Generate tokens with admin prefix
      const tokenPayload = {
        sub: String(admin.id),
        username: admin.username,
        role: admin.role,
        type: 'access',
      };

      const refreshPayload = {
        sub: String(admin.id),
        username: admin.username,
        role: admin.role,
        type: 'refresh',
      };

      const accessToken = 'aat_' + generateAccessToken(tokenPayload);
      const refreshToken = 'art_' + generateRefreshToken(refreshPayload);

      // Parse expires in to milliseconds
      const expiresInMatch = config.jwt.expiresIn.match(/^(\d+)([mhd])$/);
      let expiresIn = 7200; // Default 2 hours in seconds

      if (expiresInMatch) {
        const value = parseInt(expiresInMatch[1], 10);
        const unit = expiresInMatch[2];

        switch (unit) {
          case 'm':
            expiresIn = value * 60;
            break;
          case 'h':
            expiresIn = value * 3600;
            break;
          case 'd':
            expiresIn = value * 86400;
            break;
        }
      }

      // Update last login time
      await db('admin_users')
        .where({ id: admin.id })
        .update({ last_login_at: new Date() });

      // Log successful login
      logger.info({
        message: 'Admin login successful',
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Record admin log
      await db('admin_logs').insert({
        admin_id: admin.id,
        action: 'LOGIN',
        resource: 'auth',
        details: JSON.stringify({
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      // Send response
      sendSuccess<TokenResponse>(
        res,
        {
          accessToken,
          refreshToken,
          expiresIn,
          tokenType: 'Bearer',
        },
        'Login successful',
        200
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/logout - Admin logout
 * Requires authentication
 */
router.post(
  '/logout',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.adminId;

      if (adminId) {
        // Log logout action
        logger.info({
          message: 'Admin logout successful',
          adminId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });

        // Record admin log
        await db('admin_logs').insert({
          admin_id: adminId,
          action: 'LOGOUT',
          resource: 'auth',
          details: JSON.stringify({
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          }),
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
        });
      }

      // Note: In a stateless JWT system, actual token invalidation
      // would require a token blacklist (Redis) or short token expiry
      // For now, we just return success and let the client remove the token

      sendSuccess(res, null, 'Logout successful', 200);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh - Refresh access token
 * Uses refresh token to generate new access token
 */
router.post(
  '/refresh',
  validate(AuthValidation.refresh),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      // Validate token format (must start with 'art_')
      if (!refreshToken || !isValidRefreshTokenFormat(refreshToken)) {
        throw new UnauthorizedError('Invalid refresh token format');
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Refresh token has expired');
          }
          if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Invalid refresh token');
          }
        }
        throw new UnauthorizedError('Token verification failed');
      }

      // Ensure token type is refresh
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Check if admin still exists and is active
      const admin = await db<AdminUser>('admin_users')
        .where({ id: parseInt(decoded.sub, 10), is_active: true })
        .first();

      if (!admin) {
        throw new UnauthorizedError('Admin account not found or inactive');
      }

      // Generate new tokens (token rotation) with admin prefix
      const tokenPayload = {
        sub: String(admin.id),
        username: admin.username,
        role: admin.role,
        type: 'access',
      };

      const refreshPayload = {
        sub: String(admin.id),
        username: admin.username,
        role: admin.role,
        type: 'refresh',
      };

      const newAccessToken = 'aat_' + generateAccessToken(tokenPayload);
      const newRefreshToken = 'art_' + generateRefreshToken(refreshPayload);

      // Parse expires in to milliseconds
      const expiresInMatch = config.jwt.expiresIn.match(/^(\d+)([mhd])$/);
      let expiresIn = 7200; // Default 2 hours in seconds

      if (expiresInMatch) {
        const value = parseInt(expiresInMatch[1], 10);
        const unit = expiresInMatch[2];

        switch (unit) {
          case 'm':
            expiresIn = value * 60;
            break;
          case 'h':
            expiresIn = value * 3600;
            break;
          case 'd':
            expiresIn = value * 86400;
            break;
        }
      }

      // Log token refresh
      logger.info({
        message: 'Token refreshed',
        adminId: admin.id,
        username: admin.username,
        ip: req.ip,
      });

      // Send response
      sendSuccess<TokenResponse>(
        res,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn,
          tokenType: 'Bearer',
        },
        'Token refreshed successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/me - Get current admin info
 * Requires authentication
 */
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.adminId;

      if (!adminId) {
        throw new UnauthorizedError('Authentication required');
      }

      // Fetch admin details (exclude sensitive fields)
      const admin = await db<AdminUser>('admin_users')
        .where({ id: parseInt(adminId, 10) })
        .select(
          'id',
          'username',
          'email',
          'role',
          'avatar',
          'is_active',
          'last_login_at',
          'created_at',
          'updated_at'
        )
        .first();

      if (!admin) {
        throw new UnauthorizedError('Admin not found');
      }

      sendSuccess(
        res,
        {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
          isActive: admin.is_active,
          lastLoginAt: admin.last_login_at,
          createdAt: admin.created_at,
          updatedAt: admin.updated_at,
        },
        'Success',
        200
      );
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRoutes };
