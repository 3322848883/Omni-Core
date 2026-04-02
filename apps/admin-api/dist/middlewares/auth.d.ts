import { Request, Response, NextFunction } from 'express';
import { DecodedToken } from '../utils/jwt';
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
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Optional Authentication Middleware
 * Validates token if present, but doesn't require it
 */
export declare function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Role-based Authorization Middleware Factory
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
export declare function requireRoles(...allowedRoles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Super Admin Only Middleware
 */
export declare function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void;
/**
 * Admin or higher Middleware
 */
export declare function requireAdmin(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map