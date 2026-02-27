import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { UserRole } from '@edwix/shared';

/**
 * Role-based access control middleware.
 * Usage: router.get('/admin-only', authenticate, requireRole(UserRole.ADMIN), handler)
 * Multiple roles: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const userRole = req.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      next(new ForbiddenError(`Role '${userRole}' does not have access to this resource`));
      return;
    }

    next();
  };
}
