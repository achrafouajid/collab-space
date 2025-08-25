import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { config } from '../config/server';
import { ResponseUtil } from '../utils/response';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error caught by error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        ResponseUtil.conflict(res, 'Resource already exists');
        return;
      case 'P2025':
        ResponseUtil.notFound(res, 'Resource not found');
        return;
      default:
        ResponseUtil.internalServerError(res, 'Database operation failed');
        return;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    ResponseUtil.badRequest(res, 'Validation failed');
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Invalid token');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token expired');
    return;
  }

  // Log unknown errors
  logger.error('Unhandled error:', error);

  // Don't leak error details in production
  const message = config.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  ResponseUtil.internalServerError(res, message);
}; 