import { NotFoundError, ForbiddenError } from '../../common/errors.js';
import { businessRepository } from './business.repository.js';

export const businessService = {
  async getMyBusiness(businessId: string) {
    const business = await businessRepository.findByIdForTenant(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    return business;
  },

  async getMembers(businessId: string, requesterBusinessId: string) {
    if (businessId !== requesterBusinessId) {
      throw new ForbiddenError('Cannot access another business');
    }
    const members = await businessRepository.getMembers(businessId);
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  },

  async listAllForAdmin() {
    const businesses = await businessRepository.listAll();
    return businesses.map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      isActive: business.isActive,
      memberCount: business._count.members,
      eventCount: business._count.events,
      createdAt: business.createdAt.toISOString(),
    }));
  },
};
