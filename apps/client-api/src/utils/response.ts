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
 * Pagination meta information
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): void {
  const response = {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    message,
    requestId: (res.req as any).requestId || createRequestId(),
    timestamp: Date.now(),
  };
  res.status(200).json(response);
}

/**
 * Success response helper
 */
export function successResponse<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 200);
}

/**
 * Created response helper
 */
export function createdResponse<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Error response helper
 */
export function errorResponse(
  res: Response,
  message: string,
  code: string | number = 'INTERNAL_ERROR',
  statusCode: number = 500,
  errors?: any[]
): void {
  sendError(res, message, code, statusCode, errors);
}

/**
 * Create pagination meta
 */
export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Pagination response helper
 */
export function paginationResponse<T>(
  res: Response,
  data: { items: T[]; pagination: PaginationMeta },
  message?: string
): void {
  const response = {
    success: true,
    data: data.items,
    pagination: data.pagination,
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
  sendPaginated,
  successResponse,
  createdResponse,
  errorResponse,
  createPaginationMeta,
  paginationResponse,
};
