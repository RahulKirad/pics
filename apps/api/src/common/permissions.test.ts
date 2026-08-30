import { describe, it, expect } from 'vitest';
import { UserRole } from '@photo-platform/shared-types';
import {
  hasMinimumRole,
  isSuperAdmin,
  canManageTeam,
  canUploadPhotos,
  canEditEvents,
} from './permissions.js';

describe('permissions', () => {
  it('OWNER has higher rank than ADMIN', () => {
    expect(hasMinimumRole(UserRole.OWNER, UserRole.ADMIN)).toBe(true);
    expect(hasMinimumRole(UserRole.ADMIN, UserRole.OWNER)).toBe(false);
  });

  it('SUPER_ADMIN is identified correctly', () => {
    expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isSuperAdmin(UserRole.OWNER)).toBe(false);
  });

  it('UPLOADER can upload but not manage team', () => {
    expect(canUploadPhotos(UserRole.UPLOADER)).toBe(true);
    expect(canManageTeam(UserRole.UPLOADER)).toBe(false);
  });

  it('EDITOR can edit events', () => {
    expect(canEditEvents(UserRole.EDITOR)).toBe(true);
    expect(canEditEvents(UserRole.VIEWER)).toBe(false);
  });
});
