import { Request, Response, NextFunction } from 'express';
import { User } from '@/types/user';
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
/**
 * Authentication middleware - requires valid access token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware - doesn't require token but attaches user if present
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map