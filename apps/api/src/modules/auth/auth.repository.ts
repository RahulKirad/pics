import { prisma } from '../../database/client.js';
import type { User, Business, BusinessMember, RefreshToken } from '@prisma/client';
import { UserRole as PrismaUserRole } from '@prisma/client';

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        businessMembers: {
          where: { isActive: true },
          include: { business: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  },

  async createUserWithBusiness(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    businessName: string;
    businessSlug: string;
    planId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: PrismaUserRole.VIEWER,
        },
      });

      const business = await tx.business.create({
        data: {
          name: data.businessName,
          slug: data.businessSlug,
        },
      });

      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: PrismaUserRole.OWNER,
          joinedAt: new Date(),
        },
      });

      if (data.planId) {
        await tx.subscription.create({
          data: {
            businessId: business.id,
            planId: data.planId,
            status: 'TRIALING',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return { user, business };
    });
  },

  async getPrimaryMembership(userId: string) {
    return prisma.businessMember.findFirst({
      where: { userId, isActive: true },
      include: { business: true },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  async findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async markPasswordResetUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  async findFreePlan() {
    return prisma.plan.findUnique({ where: { tier: 'FREE' } });
  },
};

export type UserWithMemberships = User & {
  businessMembers: (BusinessMember & { business: Business })[];
};

export type RefreshTokenWithUser = RefreshToken & { user: User };
