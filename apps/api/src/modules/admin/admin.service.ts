import type {
  AdminAuditLogEntry,
  AdminEventRow,
  AdminPaymentRow,
  AdminPhotoRow,
  AdminPlatformOverview,
  AdminSubscriptionRow,
  PaginatedResponse,
  PlanTier,
  SubscriptionStatus,
} from '@photo-platform/shared-types';
import type { AdminListQuery } from '@photo-platform/validation';
import type { AuditAction } from '@prisma/client';
import { getPlatformHealth } from '../health/platform-health.service.js';
import { queueObservabilityService } from '../queues/queue-observability.service.js';
import { adminRepository } from './admin.repository.js';

function serializeAuditLog(log: {
  id: string;
  action: AuditAction;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: { id: string; email: string; firstName: string; lastName: string } | null;
  business: { id: string; name: string } | null;
}): AdminAuditLogEntry {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
    user: log.user
      ? {
          id: log.user.id,
          email: log.user.email,
          name: `${log.user.firstName} ${log.user.lastName}`.trim(),
        }
      : null,
    business: log.business,
  };
}

export const adminService = {
  async getPlatformOverview(): Promise<AdminPlatformOverview> {
    const [counts, health, queueOverview, recentActivity] = await Promise.all([
      adminRepository.getPlatformCounts(),
      getPlatformHealth(),
      queueObservabilityService.getOverview().catch(() => null),
      adminRepository.listRecentAuditLogs(8),
    ]);

    const aiJobs24h =
      queueOverview?.queues.reduce((sum, queue) => sum + queue.completed + queue.failed, 0) ?? 0;

    return {
      ...counts,
      aiJobs24h,
      systemStatus: health.status,
      services: health.services,
      recentActivity: recentActivity.map(serializeAuditLog),
    };
  },

  async listAuditLogs(query: AdminListQuery): Promise<PaginatedResponse<AdminAuditLogEntry>> {
    const result = await adminRepository.listAuditLogs({
      cursor: query.cursor,
      limit: query.limit,
      action: query.action as AuditAction | undefined,
    });

    return {
      items: result.items.map(serializeAuditLog),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },

  async listEvents(query: AdminListQuery): Promise<PaginatedResponse<AdminEventRow>> {
    const result = await adminRepository.listEvents({
      cursor: query.cursor,
      limit: query.limit,
      search: query.search,
    });

    return {
      items: result.items.map((event) => ({
        id: event.id,
        name: event.name,
        status: event.status as import('@photo-platform/shared-types').EventStatus,
        businessId: event.business.id,
        businessName: event.business.name,
        photoCount: event.photoCount,
        guestSearchCount: event.guestSearchCount,
        downloadCount: event.downloadCount,
        createdAt: event.createdAt.toISOString(),
      })),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },

  async listPhotos(query: AdminListQuery): Promise<PaginatedResponse<AdminPhotoRow>> {
    const result = await adminRepository.listPhotos({
      cursor: query.cursor,
      limit: query.limit,
      search: query.search,
    });

    return {
      items: result.items.map((photo) => ({
        id: photo.id,
        originalName: photo.originalName,
        status: photo.status as import('@photo-platform/shared-types').PhotoStatus,
        fileSize: Number(photo.fileSize),
        businessId: photo.event.business.id,
        businessName: photo.event.business.name,
        eventId: photo.event.id,
        eventName: photo.event.name,
        createdAt: photo.createdAt.toISOString(),
      })),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },

  async listSubscriptions(query: AdminListQuery): Promise<PaginatedResponse<AdminSubscriptionRow>> {
    const result = await adminRepository.listSubscriptions({
      cursor: query.cursor,
      limit: query.limit,
    });

    return {
      items: result.items.map((subscription) => ({
        id: subscription.id,
        businessId: subscription.business.id,
        businessName: subscription.business.name,
        planName: subscription.plan.name,
        planTier: subscription.plan.tier as PlanTier,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
        createdAt: subscription.createdAt.toISOString(),
      })),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },

  async listPayments(query: AdminListQuery): Promise<PaginatedResponse<AdminPaymentRow>> {
    const result = await adminRepository.listPayments({
      cursor: query.cursor,
      limit: query.limit,
    });

    return {
      items: result.items.map((payment) => ({
        id: payment.id,
        businessId: payment.business.id,
        businessName: payment.business.name,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        razorpayPayId: payment.razorpayPayId,
        razorpayOrderId: payment.razorpayOrderId,
        createdAt: payment.createdAt.toISOString(),
      })),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },
};
