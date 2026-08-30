import { describe, it, expect } from 'vitest';
import { UserRole } from '@photo-platform/shared-types';
import { signAccessToken, verifyAccessToken } from './jwt.js';

describe('jwt', () => {
  it('round-trips access token payload', () => {
    const token = signAccessToken({
      sub: 'user-1',
      businessId: 'biz-1',
      role: UserRole.OWNER,
    });

    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.businessId).toBe('biz-1');
    expect(payload.role).toBe(UserRole.OWNER);
    expect(payload.type).toBe('access');
  });

  it('rejects tampered tokens', () => {
    const token = signAccessToken({
      sub: 'user-1',
      businessId: 'biz-1',
      role: UserRole.OWNER,
    });

    expect(() => verifyAccessToken(`${token}x`)).toThrow();
  });
});
