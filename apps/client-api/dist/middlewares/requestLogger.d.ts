import { Request, Response, NextFunction } from 'express';
/**
 * Request ID middleware - assigns unique ID to each request
 */
export declare const requestId: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Request logging middleware
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requestLogger.d.ts.map