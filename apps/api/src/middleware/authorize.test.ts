import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@photo-platform/shared-types';
import { ForbiddenError, UnauthorizedError } from '../common/errors.js';
import { requireTenant, requireMinimumRole, requireSuperAdmin } from './authorize.js';

function mockRequest(auth?: Request['auth']): Request {
  return { auth } as Request;
}

function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
): Promise<void> {
  return new Promise((resolve, reject) => {
    middleware(req, {} as Response, (error?: unknown) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

describe('requireTenant', () => {
  it('rejects requests without business context', async () => {
    await expect(
      runMiddleware(requireTenant, mockRequest({ userId: 'u1', businessId: '', role: UserRole.OWNER })),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows requests with business context', async () => {
    await expect(
      runMiddleware(
        requireTenant,
        mockRequest({ userId: 'u1', businessId: 'biz-1', role: UserRole.OWNER }),
      ),
    ).resolves.toBeUndefined();
  });
});

describe('requireMinimumRole', () => {
  it('rejects unauthenticated requests', async () => {
    const middleware = requireMinimumRole(UserRole.VIEWER);
    await expect(runMiddleware(middleware, mockRequest())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects viewers from editor-only routes', async () => {
    const middleware = requireMinimumRole(UserRole.EDITOR);
    await expect(
      runMiddleware(
        middleware,
        mockRequest({ userId: 'u1', businessId: 'biz-1', role: UserRole.VIEWER }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows editors on editor routes', async () => {
    const middleware = requireMinimumRole(UserRole.EDITOR);
    await expect(
      runMiddleware(
        middleware,
        mockRequest({ userId: 'u1', businessId: 'biz-1', role: UserRole.EDITOR }),
      ),
    ).resolves.toBeUndefined();
  });
});

describe('requireSuperAdmin', () => {
  it('rejects non-super-admin users', async () => {
    await expect(
      runMiddleware(
        requireSuperAdmin,
        mockRequest({ userId: 'u1', businessId: 'biz-1', role: UserRole.OWNER }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows super admin users', async () => {
    await expect(
      runMiddleware(
        requireSuperAdmin,
        mockRequest({ userId: 'u1', businessId: 'biz-1', role: UserRole.SUPER_ADMIN }),
      ),
    ).resolves.toBeUndefined();
  });
});
