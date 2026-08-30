import { prisma } from '../../database/client.js';
import type { EventStatus, EventPrivacyMode, Prisma } from '@prisma/client';

function notDeletedFilter(): Prisma.EventWhereInput {
  return { deletedAt: null };
}

export const eventRepository = {
  async create(data: {
    businessId: string;
    name: string;
    slug: string;
    eventToken: string;
    description?: string;
    eventType?: string;
    eventDate?: Date;
    location?: string;
    expiryDate?: Date;
    privacyMode: EventPrivacyMode;
    downloadEnabled: boolean;
    guestUploadEnabled: boolean;
  }) {
    return prisma.event.create({ data: { ...data, status: 'DRAFT' } });
  },

  async findById(eventId: string, businessId: string) {
    return prisma.event.findFirst({
      where: { id: eventId, businessId, ...notDeletedFilter() },
    });
  },

  async findByIdIncludingDeleted(eventId: string, businessId: string) {
    return prisma.event.findFirst({
      where: { id: eventId, businessId },
    });
  },

  async list(businessId: string, options: {
    status?: EventStatus;
    search?: string;
    cursor?: string;
    limit: number;
  }) {
    const where: Prisma.EventWhereInput = {
      businessId,
      ...notDeletedFilter(),
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search } },
              { location: { contains: options.search } },
              { eventType: { contains: options.search } },
            ],
          }
        : {}),
    };

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = events.length > options.limit;
    const items = hasMore ? events.slice(0, options.limit) : events;

    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },

  async countByStatus(businessId: string) {
    const counts = await prisma.event.groupBy({
      by: ['status'],
      where: { businessId, ...notDeletedFilter() },
      _count: true,
    });
    return counts;
  },

  async update(eventId: string, businessId: string, data: Prisma.EventUpdateInput) {
    return prisma.event.updateMany({
      where: { id: eventId, businessId, ...notDeletedFilter() },
      data,
    });
  },

  async softDelete(eventId: string, businessId: string) {
    return prisma.event.updateMany({
      where: { id: eventId, businessId, ...notDeletedFilter() },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
  },

  async archive(eventId: string, businessId: string) {
    return prisma.event.updateMany({
      where: { id: eventId, businessId, ...notDeletedFilter() },
      data: { status: 'ARCHIVED' },
    });
  },

  async restore(eventId: string, businessId: string) {
    return prisma.event.updateMany({
      where: { id: eventId, businessId },
      data: { status: 'DRAFT', deletedAt: null },
    });
  },

  async slugExists(businessId: string, slug: string, excludeId?: string) {
    const existing = await prisma.event.findFirst({
      where: {
        businessId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  },
};
