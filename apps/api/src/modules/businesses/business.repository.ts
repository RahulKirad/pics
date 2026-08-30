import { prisma } from '../../database/client.js';

export const businessRepository = {
  async findByIdForTenant(businessId: string) {
    return prisma.business.findFirst({
      where: { id: businessId, isActive: true },
    });
  },

  async getMembers(businessId: string) {
    return prisma.businessMember.findMany({
      where: { businessId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async listAll() {
    return prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, events: true } },
      },
    });
  },
};
