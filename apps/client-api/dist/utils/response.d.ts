import { Response } from 'express';
/**
 * Generate a unique request ID
 */
export declare function createRequestId(): string;
/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    code?: string | number;
    requestId: string;
    timestamp: number;
}
/**
 * Send success response
 */
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): void;
/**
 * Alias for sendSuccess - for backward compatibility
 */
export declare const successResponse: typeof sendSuccess;
/**
 * Send created response (201)
 */
export declare function createdResponse<T>(res: Response, data: T, message?: string): void;
/**
 * Send error response
 */
export declare function sendError(res: Response, message: string, code?: string | number, statusCode?: number, errors?: any[]): void;
/**
 * Alias for sendError - for backward compatibility
 */
export declare const errorResponse: typeof sendError;
declare const _default: {
    createRequestId: typeof createRequestId;
    sendSuccess: typeof sendSuccess;
    sendError: typeof sendError;
};
export default _default;
//# sourceMappingURL=response.d.ts.map