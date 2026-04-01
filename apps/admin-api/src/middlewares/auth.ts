import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, isValidAccessTokenFormat, DecodedToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError, TokenExpiredError } from '../utils/errors';
import { db } from '../database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      adminId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates the Authorization header and attaches user info to request
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    // Validate token prefix (must start with 'aat_' for admin access token)
    if (!isValidAccessTokenFormat(token)) {
      throw new UnauthorizedError('Invalid token format');
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new TokenExpiredError('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedError('Invalid token');
        }
      }
      throw new UnauthorizedError('Token verification failed');
    }

    // Ensure token type is access
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Check if admin user still exists and is active
    const admin = await db('admin_users')
      .where({ id: decoded.sub, is_active: true })
      .first();

    if (!admin) {
      throw new UnauthorizedError('Admin account not found or inactive');
    }

    // Attach user info to request
    req.user = decoded;
    req.adminId = decoded.sub;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional Authentication Middleware
 * Validates token if present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token || !isValidAccessTokenFormat(token)) {
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      if (decoded.type === 'access') {
        const admin = await db('admin_users')
          .where({ id: decoded.sub, is_active: true })
          .first();

        if (admin) {
          req.user = decoded;
          req.adminId = decoded.sub;
        }
      }
    } catch {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based Authorization Middleware Factory
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Super Admin Only Middleware
 */
export function requireSuperAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  requireRoles('super_admin')(req, _res, next);
}

/**
 * Admin or higher Middleware
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  requireRoles('super_admin', 'admin')(req, _res, next);
}
