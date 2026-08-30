import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors.js';
import { logger } from '../config/logger.js';
import type { ApiErrorResponse, ApiSuccessResponse } from '@photo-platform/shared-types';

export function successResponse<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, message };
  res.status(statusCode).json(body);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      },
    };
    res.status(400).json(body);
    return;
  }

  logger.error({ err }, 'Unhandled error');

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    },
  };
  res.status(500).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  };
  res.status(404).json(body);
}
