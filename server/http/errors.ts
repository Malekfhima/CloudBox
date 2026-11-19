import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export interface HttpError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export function httpError(status: number, message: string, code = 'HTTP_ERROR', details?: unknown): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function errorHandler(error: HttpError, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.flatten(),
      },
    });
    return;
  }
  const status = error.status || 500;
  res.status(status).json({
    error: {
      code: error.code || (status === 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR'),
      message: status === 500 ? 'An unexpected error occurred.' : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
