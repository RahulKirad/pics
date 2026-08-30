import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@photo-platform/shared-types';
import { ForbiddenError, UnauthorizedError } from '../common/errors.js';
import { hasMinimumRole, isSuperAdmin } from '../common/permissions.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

export function requireMinimumRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (!hasMinimumRole(req.auth.role, minimumRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }
  if (!isSuperAdmin(req.auth.role)) {
    next(new ForbiddenError('Super admin access required'));
    return;
  }
  next();
}

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.businessId) {
    next(new ForbiddenError('Business context required'));
    return;
  }
  next();
}
