import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../common/errors.js';

const { findById, archive, softDelete } = vi.hoisted(() => ({
  findById: vi.fn(),
  archive: vi.fn(),
  softDelete: vi.fn(),
}));

vi.mock('./event.repository.js', () => ({
  eventRepository: {
    findById,
    findByIdIncludingDeleted: vi.fn(),
    archive,
    softDelete,
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    restore: vi.fn(),
    countByStatus: vi.fn(),
  },
}));

vi.mock('../../common/audit.js', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('../billing/quota.service.js', () => ({
  quotaService: {
    assertCanCreateEvent: vi.fn(),
  },
}));

import { eventService } from './event.service.js';

const sampleEvent = {
  id: 'event-1',
  name: 'Wedding',
  slug: 'wedding',
  eventToken: 'token',
  description: null,
  eventType: null,
  eventDate: null,
  location: null,
  expiryDate: null,
  privacyMode: 'PRIVATE_PERSONALIZED',
  downloadEnabled: true,
  guestUploadEnabled: false,
  status: 'ACTIVE',
  photoCount: 0,
  faceCount: 0,
  guestSearchCount: 0,
  downloadCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('eventService tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns event only when businessId matches', async () => {
    findById.mockResolvedValueOnce(sampleEvent);

    const result = await eventService.getById('event-1', 'biz-1');

    expect(findById).toHaveBeenCalledWith('event-1', 'biz-1');
    expect(result.id).toBe('event-1');
  });

  it('hides cross-tenant events as not found', async () => {
    findById.mockResolvedValueOnce(null);

    await expect(eventService.getById('event-1', 'biz-other')).rejects.toBeInstanceOf(NotFoundError);
    expect(findById).toHaveBeenCalledWith('event-1', 'biz-other');
  });

  it('prevents archiving events from another tenant', async () => {
    archive.mockResolvedValueOnce({ count: 0 });

    await expect(eventService.archive('event-1', 'biz-other', 'user-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('prevents deleting events from another tenant', async () => {
    softDelete.mockResolvedValueOnce({ count: 0 });

    await expect(eventService.delete('event-1', 'biz-other', 'user-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('assertEventAccess enforces business scoping', async () => {
    findById.mockResolvedValueOnce(null);

    await expect(eventService.assertEventAccess('event-1', 'biz-other')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
