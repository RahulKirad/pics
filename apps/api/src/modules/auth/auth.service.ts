import type { Response } from 'express';
import { loadEnv } from '@photo-platform/config';
import { UserRole } from '@photo-platform/shared-types';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../common/errors.js';
import { hashPassword, verifyPassword } from '../../common/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../../common/jwt.js';
import { slugify } from '../../common/slug.js';
import { createAuditLog } from '../../common/audit.js';
import { authRepository } from './auth.repository.js';
import type { RegisterInput, LoginInput } from '@photo-platform/validation';

const REFRESH_COOKIE = 'refresh_token';

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    emailVerified: boolean;
  };
  business: {
    id: string;
    name: string;
    slug: string;
  } | null;
  businessRole: UserRole | null;
}

function mapPrismaRole(role: string): UserRole {
  return role as UserRole;
}

function resolveAuthRole(
  platformRole: string,
  membershipRole?: string,
): { role: UserRole; businessRole: UserRole | null } {
  if (platformRole === 'SUPER_ADMIN') {
    return { role: UserRole.SUPER_ADMIN, businessRole: membershipRole ? mapPrismaRole(membershipRole) : null };
  }
  return {
    role: membershipRole ? mapPrismaRole(membershipRole) : UserRole.VIEWER,
    businessRole: membershipRole ? mapPrismaRole(membershipRole) : null,
  };
}

function setRefreshCookie(res: Response, token: string): void {
  const env = loadEnv();
  const expiry = getRefreshTokenExpiry();
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    expires: expiry,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

async function issueSession(
  userId: string,
  res: Response,
  meta?: { userAgent?: string; ipAddress?: string },
): Promise<AuthSession> {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  const membership = user.businessMembers[0] ?? null;
  const { role, businessRole } = resolveAuthRole(user.role, membership?.role);

  const accessToken = signAccessToken({
    sub: user.id,
    businessId: membership?.businessId ?? null,
    role,
  });

  const refreshToken = generateRefreshToken();
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  setRefreshCookie(res, refreshToken);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      emailVerified: user.emailVerified,
    },
    business: membership
      ? { id: membership.business.id, name: membership.business.name, slug: membership.business.slug }
      : null,
    businessRole,
  };
}

export const authService = {
  async register(
    input: RegisterInput,
    res: Response,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthSession> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);
    const businessSlug = slugify(input.businessName);
    const freePlan = await authRepository.findFreePlan();

    const { user, business } = await authRepository.createUserWithBusiness({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      businessName: input.businessName,
      businessSlug,
      planId: freePlan?.id,
    });

    await createAuditLog({
      userId: user.id,
      businessId: business.id,
      action: 'REGISTER',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return issueSession(user.id, res, meta);
  },

  async login(
    input: LoginInput,
    res: Response,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthSession> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    await authRepository.updateLastLogin(user.id);

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return issueSession(user.id, res, meta);
  },

  async refresh(refreshToken: string, res: Response): Promise<AuthSession> {
    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      clearRefreshCookie(res);
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    await authRepository.revokeRefreshToken(stored.id);
    return issueSession(stored.userId, res);
  },

  async logout(refreshToken: string | undefined, res: Response, userId?: string): Promise<void> {
    if (refreshToken) {
      const stored = await authRepository.findRefreshToken(hashToken(refreshToken));
      if (stored) {
        await authRepository.revokeRefreshToken(stored.id);
      }
    }
    if (userId) {
      await createAuditLog({ userId, action: 'LOGOUT' });
    }
    clearRefreshCookie(res);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await authRepository.findUserByEmail(email);
    if (user) {
      const token = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await authRepository.createPasswordResetToken(user.id, hashToken(token), expiresAt);
      // Email delivery will be implemented in a future phase
    }
    return { message: 'If an account exists with this email, a reset link has been sent.' };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const stored = await authRepository.findPasswordResetToken(hashToken(token));
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new NotFoundError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(stored.userId, passwordHash);
    await authRepository.markPasswordResetUsed(stored.id);
    await authRepository.revokeAllUserTokens(stored.userId);

    return { message: 'Password has been reset successfully.' };
  },

  async getMe(userId: string): Promise<AuthSession['user'] & { business: AuthSession['business']; businessRole: AuthSession['businessRole'] }> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const membership = user.businessMembers[0] ?? null;
    const { role, businessRole } = resolveAuthRole(user.role, membership?.role);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      emailVerified: user.emailVerified,
      business: membership
        ? { id: membership.business.id, name: membership.business.name, slug: membership.business.slug }
        : null,
      businessRole,
    };
  },
};

export { REFRESH_COOKIE };
