import type { Request, Response, NextFunction } from 'express';
import { UserRole, type AuthContext } from '@photo-platform/shared-types';
import { verifyAccessToken } from '../common/jwt.js';
import { UnauthorizedError } from '../common/errors.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: AuthContext;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      businessId: payload.businessId ?? '',
      role: payload.role,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.auth = {
      userId: payload.sub,
      businessId: payload.businessId ?? '',
      role: payload.role,
    };
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}
