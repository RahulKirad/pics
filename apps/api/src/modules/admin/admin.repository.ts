import { prisma } from '../../database/client.js';
import type { AuditAction, Prisma } from '@prisma/client';

const activeEventStatuses = ['ACTIVE', 'READY', 'PROCESSING'] as const;

export const adminRepository = {
  async getPlatformCounts() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalBusinesses,
      totalUsers,
      activeEvents,
      totalPhotos,
      storageAgg,
      guestSearches24h,
      activeSubscriptions,
      revenueAgg,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.event.count({
        where: { deletedAt: null, status: { in: [...activeEventStatuses] } },
      }),
      prisma.photo.count(),
      prisma.storageUsage.aggregate({
        where: { eventId: null },
        _sum: { totalBytes: true },
      }),
      prisma.guestSearch.count({ where: { createdAt: { gte: since24h } } }),
      prisma.subscription.count({
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalBusinesses,
      totalUsers,
      activeEvents,
      totalPhotos,
      totalStorageBytes: Number(storageAgg._sum.totalBytes ?? 0),
      guestSearches24h,
      activeSubscriptions,
      totalRevenue: revenueAgg._sum.amount ?? 0,
    };
  },

  async listRecentAuditLogs(limit: number) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        business: { select: { id: true, name: true } },
      },
    });
  },

  async listAuditLogs(options: { cursor?: string; limit: number; action?: AuditAction }) {
    const where: Prisma.AuditLogWhereInput = options.action ? { action: options.action } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        business: { select: { id: true, name: true } },
      },
    });

    const hasMore = logs.length > options.limit;
    const items = hasMore ? logs.slice(0, options.limit) : logs;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  },

  async listEvents(options: { cursor?: string; limit: number; search?: string }) {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search } },
              { business: { name: { contains: options.search } } },
            ],
          }
        : {}),
    };

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    const hasMore = events.length > options.limit;
    const items = hasMore ? events.slice(0, options.limit) : events;

    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },

  async listPhotos(options: { cursor?: string; limit: number; search?: string }) {
    const where: Prisma.PhotoWhereInput = options.search
      ? {
          OR: [
            { originalName: { contains: options.search } },
            { event: { name: { contains: options.search } } },
            { event: { business: { name: { contains: options.search } } } },
          ],
        }
      : {};

    const photos = await prisma.photo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        event: {
          select: {
            id: true,
            name: true,
            business: { select: { id: true, name: true } },
          },
        },
      },
    });

    const hasMore = photos.length > options.limit;
    const items = hasMore ? photos.slice(0, options.limit) : photos;

    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },

  async listSubscriptions(options: { cursor?: string; limit: number }) {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        business: { select: { id: true, name: true, slug: true } },
        plan: true,
      },
    });

    const hasMore = subscriptions.length > options.limit;
    const items = hasMore ? subscriptions.slice(0, options.limit) : subscriptions;

    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },

  async listPayments(options: { cursor?: string; limit: number }) {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    const hasMore = payments.length > options.limit;
    const items = hasMore ? payments.slice(0, options.limit) : payments;

    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },
};
