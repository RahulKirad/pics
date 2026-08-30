import type { Event, GuestConsent, GuestSession } from '@prisma/client';
import { prisma } from '../../database/client.js';

type EventWithBusiness = Event & {
  business: { name: string };
};

export const guestRepository = {
  findEventByToken(eventToken: string): Promise<EventWithBusiness | null> {
    return prisma.event.findFirst({
      where: { eventToken, deletedAt: null },
      include: { business: { select: { name: true } } },
    });
  },

  createSession(data: {
    eventId: string;
    sessionToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GuestSession> {
    return prisma.guestSession.create({ data });
  },

  findSessionByToken(sessionToken: string): Promise<
    | (GuestSession & {
        event: Event;
        consents: GuestConsent[];
      })
    | null
  > {
    return prisma.guestSession.findUnique({
      where: { sessionToken },
      include: {
        event: true,
        consents: { orderBy: { consentTimestamp: 'desc' }, take: 1 },
      },
    });
  },

  createConsent(data: {
    guestSessionId: string;
    eventId: string;
    consentGiven: boolean;
    consentVersion: string;
    ipAddress?: string;
  }): Promise<GuestConsent> {
    return prisma.guestConsent.create({ data });
  },

  createGuestSearch(data: {
    id: string;
    guestSessionId: string;
    eventId: string;
    selfieStorageKey: string;
    similarityThreshold: number;
  }) {
    return prisma.guestSearch.create({ data });
  },

  findGuestSearch(searchId: string, guestSessionId: string) {
    return prisma.guestSearch.findFirst({
      where: { id: searchId, guestSessionId },
    });
  },

  findGuestSearchWithMatches(searchId: string, guestSessionId: string) {
    return prisma.guestSearch.findFirst({
      where: { id: searchId, guestSessionId },
      include: {
        matches: {
          orderBy: { rank: 'asc' },
          include: { photo: true },
        },
      },
    });
  },

  findGuestSessionPhotoAccess(guestSessionId: string, photoId: string) {
    return prisma.guestSearchMatch.findFirst({
      where: {
        photoId,
        guestSearch: { guestSessionId },
      },
      include: { photo: true },
    });
  },

  incrementGuestSearchCount(eventId: string) {
    return prisma.event.update({
      where: { id: eventId },
      data: { guestSearchCount: { increment: 1 } },
    });
  },

  markGuestSearchFailed(searchId: string, errorMessage: string) {
    return prisma.guestSearch.update({
      where: { id: searchId },
      data: {
        errorMessage,
        processingMs: 0,
      },
    });
  },
};
