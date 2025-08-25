import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any[];
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors
    };

    return res.status(400).json(response);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(401).json(response);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(403).json(response);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(404).json(response);
  }

  static conflict(
    res: Response,
    message: string = 'Resource already exists'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(409).json(response);
  }

  static internalServerError(
    res: Response,
    message: string = 'Internal server error'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(500).json(response);
  }
} 