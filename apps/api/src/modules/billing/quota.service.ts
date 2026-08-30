import type { QuotaUsage } from '@photo-platform/shared-types';
import { ForbiddenError, QuotaExceededError } from '../../common/errors.js';
import { prisma } from '../../database/client.js';
import { storageUsageRepository } from '../storage/storage-usage.repository.js';
import { billingRepository } from './billing.repository.js';

const GB = 1024 ** 3;

function metric(used: number, limit: number) {
  return { used, limit };
}

export const quotaService = {
  async getPlanForBusiness(businessId: string) {
    const subscription = await billingRepository.getSubscriptionForBusiness(businessId);
    if (subscription?.plan) {
      return { subscription, plan: subscription.plan };
    }

    const freePlan = await billingRepository.findPlanByTier('FREE');
    if (!freePlan) {
      throw new ForbiddenError('No subscription plan configured');
    }

    return { subscription, plan: freePlan };
  },

  async assertSubscriptionUsable(businessId: string) {
    const { subscription } = await this.getPlanForBusiness(businessId);

    if (!subscription) {
      return;
    }

    if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED') {
      throw new QuotaExceededError('Subscription inactive. Please renew your plan.');
    }

    if (subscription.status === 'PAST_DUE') {
      throw new QuotaExceededError('Payment past due. Please update billing.');
    }

    if (
      subscription.status === 'TRIALING' &&
      subscription.trialEndsAt &&
      subscription.trialEndsAt < new Date()
    ) {
      throw new QuotaExceededError('Free trial expired. Please upgrade your plan.');
    }

    if (
      subscription.status === 'ACTIVE' &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd < new Date()
    ) {
      throw new QuotaExceededError('Subscription period ended. Please renew your plan.');
    }
  },

  async getUsage(businessId: string): Promise<QuotaUsage> {
    const { plan } = await this.getPlanForBusiness(businessId);

    const [eventCount, photoAgg, storageUsage, searchAgg, downloadAgg, teamCount] =
      await Promise.all([
        prisma.event.count({
          where: { businessId, deletedAt: null },
        }),
        prisma.event.aggregate({
          where: { businessId, deletedAt: null },
          _sum: { photoCount: true },
        }),
        storageUsageRepository.getBusinessUsage(businessId),
        prisma.event.aggregate({
          where: { businessId, deletedAt: null },
          _sum: { guestSearchCount: true },
        }),
        prisma.event.aggregate({
          where: { businessId, deletedAt: null },
          _sum: { downloadCount: true },
        }),
        prisma.businessMember.count({
          where: { businessId, isActive: true },
        }),
      ]);

    return {
      events: metric(eventCount, plan.maxEvents),
      photos: metric(photoAgg._sum.photoCount ?? 0, plan.maxPhotos),
      storageBytes: metric(Number(storageUsage?.totalBytes ?? 0), plan.maxStorageGb * GB),
      faceSearches: metric(searchAgg._sum.guestSearchCount ?? 0, plan.maxFaceSearches),
      downloads: metric(downloadAgg._sum.downloadCount ?? 0, plan.maxDownloads),
      teamMembers: metric(teamCount, plan.maxTeamMembers),
    };
  },

  async assertCanCreateEvent(businessId: string) {
    await this.assertSubscriptionUsable(businessId);
    const usage = await this.getUsage(businessId);
    if (usage.events.used >= usage.events.limit) {
      throw new QuotaExceededError(
        `Event limit reached (${usage.events.limit}). Upgrade your plan to create more events.`,
      );
    }
  },

  async assertCanUploadPhoto(businessId: string, additionalBytes = 0) {
    await this.assertSubscriptionUsable(businessId);
    const usage = await this.getUsage(businessId);
    if (usage.photos.used >= usage.photos.limit) {
      throw new QuotaExceededError(
        `Photo limit reached (${usage.photos.limit}). Upgrade your plan to upload more photos.`,
      );
    }
    if (usage.storageBytes.used + additionalBytes > usage.storageBytes.limit) {
      throw new QuotaExceededError(
        `Storage limit reached (${usage.storageBytes.limit / GB} GB). Upgrade your plan for more storage.`,
      );
    }
  },

  async assertCanRunFaceSearch(businessId: string) {
    await this.assertSubscriptionUsable(businessId);
    const usage = await this.getUsage(businessId);
    if (usage.faceSearches.used >= usage.faceSearches.limit) {
      throw new QuotaExceededError(
        `Guest search limit reached (${usage.faceSearches.limit}). Upgrade your plan.`,
      );
    }
  },
};
