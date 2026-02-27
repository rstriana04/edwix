import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import type { ApiErrorResponse } from '@edwix/shared';

/** Global error handler — must be registered last in the middleware chain */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Log unexpected errors in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message || 'An unexpected error occurred',
    },
  };
  res.status(500).json(body);
}
