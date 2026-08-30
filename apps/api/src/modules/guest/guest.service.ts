import type { Event } from '@prisma/client';
import {
  EventStatus,
  GUEST_CONSENT_VERSION,
  type GuestConsentResult,
  type GuestEventPublic,
  type GuestSessionSummary,
} from '@photo-platform/shared-types';
import { generateEventToken } from '../../common/event-token.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { GUEST_ACCESSIBLE_STATUSES, GUEST_SESSION_TTL_HOURS } from './guest.constants.js';
import { guestRepository } from './guest.repository.js';

export function isGuestEventAccessible(event: Event, now = new Date()): boolean {
  if (event.deletedAt) return false;
  if (!GUEST_ACCESSIBLE_STATUSES.includes(event.status as (typeof GUEST_ACCESSIBLE_STATUSES)[number])) {
    return false;
  }
  if (event.expiryDate && event.expiryDate < now) return false;
  return true;
}

export function getGuestEventUnavailableReason(event: Event, now = new Date()): string {
  if (event.deletedAt || event.status === EventStatus.DELETED) {
    return 'This event is no longer available.';
  }
  if (event.status === EventStatus.DRAFT) {
    return 'This event is not open to guests yet.';
  }
  if (event.status === EventStatus.ARCHIVED) {
    return 'This event has been archived.';
  }
  if (event.status === EventStatus.EXPIRED || (event.expiryDate && event.expiryDate < now)) {
    return 'This event has expired.';
  }
  return 'This event is not available.';
}

function serializeGuestEvent(event: {
  name: string;
  description: string | null;
  eventType: string | null;
  eventDate: Date | null;
  location: string | null;
  privacyMode: string;
  downloadEnabled: boolean;
  guestUploadEnabled: boolean;
  status: string;
  photoCount: number;
  business: { name: string };
}): GuestEventPublic {
  return {
    name: event.name,
    description: event.description,
    eventType: event.eventType,
    eventDate: event.eventDate?.toISOString() ?? null,
    location: event.location,
    privacyMode: event.privacyMode as GuestEventPublic['privacyMode'],
    downloadEnabled: event.downloadEnabled,
    guestUploadEnabled: event.guestUploadEnabled,
    status: event.status as GuestEventPublic['status'],
    photoCount: event.photoCount,
    businessName: event.business.name,
  };
}

function serializeGuestSession(
  session: { sessionToken: string; expiresAt: Date },
  eventToken: string,
  hasConsent: boolean,
  consentVersion: string | null,
): GuestSessionSummary {
  return {
    sessionToken: session.sessionToken,
    eventToken,
    expiresAt: session.expiresAt.toISOString(),
    hasConsent,
    consentVersion,
  };
}

function assertSessionActive(expiresAt: Date, now = new Date()): void {
  if (expiresAt <= now) {
    throw new ForbiddenError('Your guest session has expired. Please start again.');
  }
}

function getClientMeta(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ??
    req.ip ??
    undefined;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
  return { ipAddress: ip, userAgent };
}

export const guestService = {
  async getPublicEvent(eventToken: string): Promise<GuestEventPublic> {
    const event = await guestRepository.findEventByToken(eventToken);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (!isGuestEventAccessible(event)) {
      throw new ForbiddenError(getGuestEventUnavailableReason(event));
    }
    return serializeGuestEvent(event);
  },

  async createSession(
    eventToken: string,
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<GuestSessionSummary> {
    const event = await guestRepository.findEventByToken(eventToken);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (!isGuestEventAccessible(event)) {
      throw new ForbiddenError(getGuestEventUnavailableReason(event));
    }

    const expiresAt = new Date(Date.now() + GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000);
    const { ipAddress, userAgent } = getClientMeta(req);
    const session = await guestRepository.createSession({
      eventId: event.id,
      sessionToken: generateEventToken(),
      expiresAt,
      ipAddress,
      userAgent,
    });

    return serializeGuestSession(session, event.eventToken, false, null);
  },

  async getSession(sessionToken: string): Promise<GuestSessionSummary> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const latestConsent = session.consents[0];
    const hasConsent = latestConsent?.consentGiven === true;
    return serializeGuestSession(
      session,
      session.event.eventToken,
      hasConsent,
      latestConsent?.consentVersion ?? null,
    );
  },

  async recordConsent(
    sessionToken: string,
    consentVersion: string,
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<GuestConsentResult> {
    if (consentVersion !== GUEST_CONSENT_VERSION) {
      throw new ValidationError(`Unsupported consent version. Expected ${GUEST_CONSENT_VERSION}.`);
    }

    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const { ipAddress } = getClientMeta(req);
    const consent = await guestRepository.createConsent({
      guestSessionId: session.id,
      eventId: session.eventId,
      consentGiven: true,
      consentVersion,
      ipAddress,
    });

    return {
      consentVersion: consent.consentVersion,
      consentTimestamp: consent.consentTimestamp.toISOString(),
    };
  },
};
