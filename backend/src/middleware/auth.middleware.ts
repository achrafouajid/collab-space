import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/server';
import { AuthenticationError, AuthorizationError } from '../utils/error-handler';
import { ResponseUtil } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, 'Invalid token');
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtil.unauthorized(res, 'Token expired');
      return;
    }
    ResponseUtil.unauthorized(res, 'Authentication failed');
    return;
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        ResponseUtil.forbidden(res, error.message);
        return;
      }
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }
  };
}; 