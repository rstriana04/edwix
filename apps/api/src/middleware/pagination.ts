import { Request, Response, NextFunction } from 'express';
import { PAGINATION } from '@edwix/shared';

/** Parsed pagination parameters attached to the request */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams;
    }
  }
}

/**
 * Parses pagination query params and attaches them to req.pagination.
 * Defaults: page=1, limit=20, sortOrder=desc
 */
export function parsePagination(defaultSortBy = 'createdAt') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT),
    );

    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
      search: (req.query.search as string) || undefined,
      sortBy: (req.query.sortBy as string) || defaultSortBy,
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    next();
  };
}
