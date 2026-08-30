import type { CreateEventInput, UpdateEventInput, ListEventsQuery } from '@photo-platform/validation';
import { NotFoundError, ForbiddenError } from '../../common/errors.js';
import { slugify } from '../../common/slug.js';
import { generateEventToken } from '../../common/event-token.js';
import { createAuditLog } from '../../common/audit.js';
import { eventRepository } from './event.repository.js';

function serializeEvent(event: {
  id: string;
  name: string;
  slug: string;
  eventToken: string;
  description: string | null;
  eventType: string | null;
  eventDate: Date | null;
  location: string | null;
  expiryDate: Date | null;
  privacyMode: string;
  downloadEnabled: boolean;
  guestUploadEnabled: boolean;
  status: string;
  photoCount: number;
  faceCount: number;
  guestSearchCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    eventToken: event.eventToken,
    description: event.description,
    eventType: event.eventType,
    eventDate: event.eventDate?.toISOString() ?? null,
    location: event.location,
    expiryDate: event.expiryDate?.toISOString() ?? null,
    privacyMode: event.privacyMode,
    downloadEnabled: event.downloadEnabled,
    guestUploadEnabled: event.guestUploadEnabled,
    status: event.status,
    photoCount: event.photoCount,
    faceCount: event.faceCount,
    guestSearchCount: event.guestSearchCount,
    downloadCount: event.downloadCount,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function parseOptionalDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

export const eventService = {
  async create(businessId: string, userId: string, input: CreateEventInput) {
    const { quotaService } = await import('../billing/quota.service.js');
    await quotaService.assertCanCreateEvent(businessId);

    const slug = slugify(input.name);
    const eventToken = generateEventToken();

    const event = await eventRepository.create({
      businessId,
      name: input.name,
      slug,
      eventToken,
      description: input.description,
      eventType: input.eventType,
      eventDate: parseOptionalDate(input.eventDate),
      location: input.location,
      expiryDate: parseOptionalDate(input.expiryDate),
      privacyMode: input.privacyMode,
      downloadEnabled: input.downloadEnabled,
      guestUploadEnabled: input.guestUploadEnabled,
    });

    await createAuditLog({
      userId,
      businessId,
      action: 'EVENT_CREATE',
      entityType: 'event',
      entityId: event.id,
    });

    return serializeEvent(event);
  },

  async list(businessId: string, query: ListEventsQuery) {
    const result = await eventRepository.list(businessId, {
      status: query.status,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    });

    return {
      items: result.items.map(serializeEvent),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },

  async getById(eventId: string, businessId: string) {
    const event = await eventRepository.findById(eventId, businessId);
    if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    return serializeEvent(event);
  },

  async update(eventId: string, businessId: string, userId: string, input: UpdateEventInput) {
    const existing = await eventRepository.findById(eventId, businessId);
    if (!existing) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.eventType !== undefined) updateData.eventType = input.eventType;
    if (input.eventDate !== undefined) updateData.eventDate = input.eventDate ? new Date(input.eventDate) : null;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (input.privacyMode !== undefined) updateData.privacyMode = input.privacyMode;
    if (input.downloadEnabled !== undefined) updateData.downloadEnabled = input.downloadEnabled;
    if (input.guestUploadEnabled !== undefined) updateData.guestUploadEnabled = input.guestUploadEnabled;
    if (input.status !== undefined) updateData.status = input.status;

    if (input.name && input.name !== existing.name) {
      updateData.slug = slugify(input.name);
    }

    await eventRepository.update(eventId, businessId, updateData);
    const updated = await eventRepository.findById(eventId, businessId);

    await createAuditLog({
      userId,
      businessId,
      action: 'EVENT_UPDATE',
      entityType: 'event',
      entityId: eventId,
    });

    return serializeEvent(updated!);
  },

  async archive(eventId: string, businessId: string, userId: string) {
    const result = await eventRepository.archive(eventId, businessId);
    if (result.count === 0) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

    await createAuditLog({
      userId,
      businessId,
      action: 'EVENT_ARCHIVE',
      entityType: 'event',
      entityId: eventId,
    });

    return this.getById(eventId, businessId);
  },

  async restore(eventId: string, businessId: string, userId: string) {
    const existing = await eventRepository.findByIdIncludingDeleted(eventId, businessId);
    if (!existing) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    if (existing.deletedAt === null && existing.status !== 'ARCHIVED') {
      throw new ForbiddenError('Event is not archived or deleted');
    }

    await eventRepository.restore(eventId, businessId);

    await createAuditLog({
      userId,
      businessId,
      action: 'EVENT_UPDATE',
      entityType: 'event',
      entityId: eventId,
      metadata: { action: 'restore' },
    });

    return this.getById(eventId, businessId);
  },

  async delete(eventId: string, businessId: string, userId: string) {
    const result = await eventRepository.softDelete(eventId, businessId);
    if (result.count === 0) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

    await createAuditLog({
      userId,
      businessId,
      action: 'EVENT_DELETE',
      entityType: 'event',
      entityId: eventId,
    });
  },

  async getStats(businessId: string) {
    const counts = await eventRepository.countByStatus(businessId);
    const statusMap: Record<string, number> = {};
    let total = 0;
    for (const c of counts) {
      statusMap[c.status] = c._count;
      total += c._count;
    }
    return { total, byStatus: statusMap };
  },

  async assertEventAccess(eventId: string, businessId: string) {
    const event = await eventRepository.findById(eventId, businessId);
    if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    return event;
  },
};
