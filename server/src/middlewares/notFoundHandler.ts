import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Resource not found on this server: ${req.method} ${req.originalUrl}`, 404));
}

