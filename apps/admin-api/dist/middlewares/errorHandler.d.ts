import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, unknown>;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
export declare const errorHandler: (err: ApiError | any, req: Request, res: Response, _next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number, code?: string, details?: Record<string, unknown>) => ApiError;
//# sourceMappingURL=errorHandler.d.ts.map