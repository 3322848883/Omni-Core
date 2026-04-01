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
 * Send error response
 */
export declare function sendError(res: Response, message: string, code?: string | number, statusCode?: number, errors?: any[]): void;
/**
 * Send paginated response
 */
export declare function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number, message?: string): void;
declare const _default: {
    createRequestId: typeof createRequestId;
    sendSuccess: typeof sendSuccess;
    sendError: typeof sendError;
    sendPaginated: typeof sendPaginated;
};
export default _default;
//# sourceMappingURL=response.d.ts.map