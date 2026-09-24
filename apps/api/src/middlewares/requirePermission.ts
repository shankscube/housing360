import { NextFunction, Request, Response } from 'express';
import { roleHasPermission } from '../constants/permissions';
import { AppError } from '../utils/AppError';

/**
 * Runs AFTER `requireAuth` (which populates `req.user`). 403s via the normal
 * `AppError`/`errorHandler` path — same responder convention as every other
 * failure, not a bespoke response.
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roleHasPermission(req.user.role, permission)) {
      next(new AppError(403, `Missing required permission: ${permission}`));
      return;
    }
    next();
  };
}
