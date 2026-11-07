import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  const details = err instanceof AppError ? err.details : undefined;

  logger.error(`Error [${statusCode}]: ${message}`, {
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    details,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}

