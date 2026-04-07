import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/jwt';
import { UnauthorizedError } from '@/errors/AppError';
import { isBlacklisted } from '@/services/tokenBlacklist';
import db from '@/config/database';
import { User } from '@/types/user';
import { USER_STATUS } from '@/constants';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Format database user to User type
 */
const formatUser = (dbUser: Record<string, unknown>): User => {
  return {
    id: String(dbUser.user_id),
    email: dbUser.email as string,
    username: dbUser.username as string,
    role: 'user',
    status: (dbUser.status === 1 || String(dbUser.status) === '1') ? 'active' : 'inactive',
    emailVerified: true,
    twoFactorEnabled: false,
    lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at as number) : undefined,
    lastLoginIp: dbUser.last_login_ip as string | undefined,
    createdAt: new Date(dbUser.created_at as number),
    updatedAt: new Date(dbUser.updated_at as number)
  };
};

/**
 * Authentication middleware - requires valid access token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const dbUser = await db('users')
      .where({ user_id: decoded.userId })
      .first();

    if (!dbUser) {
      throw new UnauthorizedError('User not found');
    }

    // Check user status - support both numeric (1) and string ('active') formats
    const isActive = dbUser.status === 1 || String(dbUser.status) === '1';
    if (!isActive) {
      throw new UnauthorizedError('Account is not active');
    }

    // Attach formatted user to request
    req.user = formatUser(dbUser);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't require token but attaches user if present
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const dbUser = await db('users')
          .where({ user_id: decoded.userId })
          .first();

        if (dbUser) {
          // Check user status - support both numeric (1) and string ('active') formats
          const isActive = dbUser.status === 1 || String(dbUser.status) === '1';
          if (isActive) {
            req.user = formatUser(dbUser);
          }
        }
      } catch {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
