import { UserRole } from '@photo-platform/shared-types';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.OWNER]: 80,
  [UserRole.ADMIN]: 70,
  [UserRole.EDITOR]: 50,
  [UserRole.UPLOADER]: 40,
  [UserRole.VIEWER]: 10,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function canManageTeam(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.ADMIN);
}

export function canUploadPhotos(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.UPLOADER);
}

export function canEditEvents(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.EDITOR);
}

export function canManageBusiness(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.OWNER);
}
