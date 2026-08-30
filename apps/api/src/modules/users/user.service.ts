import { updateProfileSchema } from '@photo-platform/validation';
import type { UserRole } from '@photo-platform/shared-types';
import { NotFoundError } from '../../common/errors.js';
import { userRepository } from './user.repository.js';

export const userService = {
  async updateProfile(userId: string, input: unknown) {
    const data = updateProfileSchema.parse(input);
    const user = await userRepository.updateProfile(userId, data);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  },

  async listAllForAdmin() {
    const users = await userRepository.listAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      businessCount: user._count.businessMembers,
      createdAt: user.createdAt.toISOString(),
    }));
  },
};
