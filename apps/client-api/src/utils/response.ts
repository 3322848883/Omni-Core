import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique request ID
 */
export function createRequestId(): string {
  return uuidv4();
}

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
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId: (res.req as any).requestId || createRequestId(),
    timestamp: Date.now(),
  };
  res.status(statusCode).json(response);
}

/**
 * Alias for sendSuccess - for backward compatibility
 */
export const successResponse = sendSuccess;

/**
 * Send created response (201)
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId: (res.req as any).requestId || createRequestId(),
    timestamp: Date.now(),
  };
  res.status(201).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  code: string | number = 'INTERNAL_ERROR',
  statusCode: number = 500,
  errors?: any[]
): void {
  const response: ApiResponse = {
    success: false,
    message,
    code,
    requestId: (res.req as any).requestId || createRequestId(),
    timestamp: Date.now(),
  };
  res.status(statusCode).json(response);
}

/**
 * Alias for sendError - for backward compatibility
 */
export const errorResponse = sendError;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Send pagination response
 */
export function paginationResponse<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
): void {
  const response: ApiResponse<{ data: T[]; meta: PaginationMeta }> = {
    success: true,
    data: {
      data,
      meta,
    },
    message,
    requestId: (res.req as any).requestId || createRequestId(),
    timestamp: Date.now(),
  };
  res.status(200).json(response);
}

export default {
  createRequestId,
  sendSuccess,
  sendError,
  createPaginationMeta,
  paginationResponse,
};
