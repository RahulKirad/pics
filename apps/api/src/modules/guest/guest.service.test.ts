import { describe, it, expect } from 'vitest';
import { EventStatus } from '@photo-platform/shared-types';
import type { Event } from '@prisma/client';
import {
  getGuestEventUnavailableReason,
  isGuestEventAccessible,
} from './guest.service.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    businessId: 'biz-1',
    name: 'Wedding',
    slug: 'wedding',
    eventToken: 'token',
    description: null,
    eventType: null,
    eventDate: null,
    location: null,
    coverImageKey: null,
    expiryDate: null,
    privacyMode: 'PRIVATE_PERSONALIZED',
    downloadEnabled: true,
    guestUploadEnabled: false,
    status: EventStatus.ACTIVE,
    photoCount: 10,
    faceCount: 5,
    guestSearchCount: 0,
    downloadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('isGuestEventAccessible', () => {
  it('allows active events without expiry', () => {
    expect(isGuestEventAccessible(makeEvent())).toBe(true);
  });

  it('rejects draft events', () => {
    expect(isGuestEventAccessible(makeEvent({ status: EventStatus.DRAFT }))).toBe(false);
  });

  it('rejects archived events', () => {
    expect(isGuestEventAccessible(makeEvent({ status: EventStatus.ARCHIVED }))).toBe(false);
  });

  it('rejects expired events by date', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(
      isGuestEventAccessible(
        makeEvent({ expiryDate: new Date('2025-12-31T00:00:00.000Z') }),
        now,
      ),
    ).toBe(false);
  });

  it('rejects deleted events', () => {
    expect(isGuestEventAccessible(makeEvent({ deletedAt: new Date() }))).toBe(false);
  });
});

describe('getGuestEventUnavailableReason', () => {
  it('returns draft message', () => {
    expect(getGuestEventUnavailableReason(makeEvent({ status: EventStatus.DRAFT }))).toContain(
      'not open',
    );
  });

  it('returns expired message', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(
      getGuestEventUnavailableReason(
        makeEvent({ expiryDate: new Date('2025-12-31T00:00:00.000Z') }),
        now,
      ),
    ).toContain('expired');
  });
});
