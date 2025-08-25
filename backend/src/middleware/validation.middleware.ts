import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, AnyZodObject } from 'zod';
import { ResponseUtil } from '../utils/response';

// Overloaded function to handle both patterns
export function validateRequest(schema: AnyZodObject): (req: Request, res: Response, next: NextFunction) => void;
export function validateRequest(schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}): (req: Request, res: Response, next: NextFunction) => void;
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if it's a wrapped schema (has body, params, or query properties)
      if (schema.body || schema.params || schema.query) {
        // Handle the object-wrapped style
        if (schema.body) {
          req.body = schema.body.parse(req.body);
        }
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }
        if (schema.query) {
          req.query = schema.query.parse(req.query);
        }
      } else {
        // Handle the direct Zod object style (auth schemas)
        const validatedData = schema.parse({
          body: req.body,
          params: req.params,
          query: req.query,
        });

        if (validatedData.body) {
          req.body = validatedData.body;
        }
        if (validatedData.params) {
          req.params = validatedData.params;
        }
        if (validatedData.query) {
          req.query = validatedData.query;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ResponseUtil.badRequest(
          res,
          'Validation failed',
          errorMessages
        );
        return;
      }

      ResponseUtil.badRequest(res, 'Invalid request data');
      return;
    }
  };
}; 