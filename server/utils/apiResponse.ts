import { Response } from 'express';
import { APIResponse, PaginatedResponse, ErrorResponse } from '../types/api';

/**
 * Send successful API response
 */
export function sendSuccess<T = any>(
  res: Response, 
  data?: T, 
  message?: string, 
  statusCode: number = 200
): void {
  const response: APIResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Send paginated API response
 */
export function sendPaginatedResponse<T = any>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string,
  statusCode: number = 200
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  const response: PaginatedResponse<T[]> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Send error API response
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): void {
  const response: ErrorResponse = {
    success: false,
    error,
    code: code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>,
  message: string = 'Validation failed'
): void {
  const response: ErrorResponse = {
    success: false,
    error: message,
    code: 'VALIDATION_ERROR',
    details: errors,
    timestamp: new Date().toISOString(),
  };

  res.status(400).json(response);
}

/**
 * Send unauthorized error
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized access'
): void {
  sendError(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send forbidden error
 */
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden access'
): void {
  sendError(res, message, 403, 'FORBIDDEN');
}

/**
 * Send not found error
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): void {
  sendError(res, message, 404, 'NOT_FOUND');
}

/**
 * Send rate limit error
 */
export function sendRateLimit(
  res: Response,
  message: string = 'Too many requests'
): void {
  sendError(res, message, 429, 'RATE_LIMIT_EXCEEDED');
}
