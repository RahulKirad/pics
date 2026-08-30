import { describe, it, expect, beforeEach } from 'vitest';
import { validateStorageKey, resolveSafePath, isTenantStorageKey } from './path-security.js';
import { StorageError } from '../common/errors.js';
import { resetEnvCache } from '@photo-platform/config';

describe('path-security', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_SECRET = 'test-jwt-secret-min-16-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-16';
    process.env.STORAGE_ROOT = '/tmp/photo-platform-test';
    resetEnvCache();
  });

  it('rejects path traversal in storage keys', () => {
    expect(() => validateStorageKey('../etc/passwd')).toThrow(StorageError);
    expect(() => validateStorageKey('tenant_1/../../secret')).toThrow(StorageError);
  });

  it('rejects keys without tenant prefix', () => {
    expect(() => validateStorageKey('random/path/file.jpg')).toThrow(StorageError);
  });

  it('allows keys owned by the business tenant', () => {
    expect(
      isTenantStorageKey('tenant_biz-1/event_evt-1/originals/photo.jpg', 'biz-1'),
    ).toBe(true);
  });

  it('denies keys owned by another business tenant', () => {
    expect(
      isTenantStorageKey('tenant_biz-2/event_evt-1/originals/photo.jpg', 'biz-1'),
    ).toBe(false);
  });

  it('resolves paths within storage root', () => {
    const resolved = resolveSafePath('tenant_abc/event_xyz/originals/photo.jpg');
    expect(resolved).toContain('tenant_abc/event_xyz/originals/photo.jpg');
  });

  it('blocks escape from storage root', () => {
    expect(() => resolveSafePath('tenant_abc/../../../etc/passwd')).toThrow(StorageError);
  });
});
