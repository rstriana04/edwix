import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validates request body/query/params against a Zod schema.
 * Usage: router.post('/path', validate(schema, 'body'), controller)
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace with parsed (coerced/defaulted) values
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new ValidationError(
            err.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          ),
        );
        return;
      }
      next(err);
    }
  };
}
