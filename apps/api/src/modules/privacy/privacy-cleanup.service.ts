import type { CleanupRunResult } from '@photo-platform/shared-types';
import { prisma } from '../../database/client.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { privacySettingsService } from './privacy-settings.service.js';

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

async function deleteStorageKey(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    const storage = getStorageProvider();
    await storage.delete(key);
    return true;
  } catch {
    return false;
  }
}

export const privacyCleanupService = {
  async runCleanup(now = new Date()): Promise<CleanupRunResult> {
    const settings = await privacySettingsService.getSettings();
    const sessionCutoff = subtractDays(now, settings.guestSessionRetentionDays);
    const selfieCutoff = subtractDays(now, settings.guestSelfieRetentionDays);

    let expiredEvents = 0;
    let deletedSessions = 0;
    let deletedSelfies = 0;
    let purgedSearches = 0;

    if (settings.autoExpireEvents) {
      const result = await prisma.event.updateMany({
        where: {
          deletedAt: null,
          expiryDate: { lt: now },
          status: { notIn: ['EXPIRED', 'DELETED', 'ARCHIVED'] },
        },
        data: { status: 'EXPIRED' },
      });
      expiredEvents = result.count;
    }

    const staleSelfies = await prisma.guestSearch.findMany({
      where: {
        createdAt: { lt: selfieCutoff },
        selfieStorageKey: { not: null },
      },
      select: { id: true, selfieStorageKey: true },
      take: 500,
    });

    for (const search of staleSelfies) {
      if (await deleteStorageKey(search.selfieStorageKey)) {
        deletedSelfies += 1;
      }
      await prisma.guestSearch.update({
        where: { id: search.id },
        data: { selfieStorageKey: null, embeddingStored: false },
      });
      purgedSearches += 1;
    }

    const expiredSessions = await prisma.guestSession.findMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { createdAt: { lt: sessionCutoff } }],
      },
      include: {
        searches: { select: { id: true, selfieStorageKey: true } },
      },
      take: 200,
    });

    for (const session of expiredSessions) {
      for (const search of session.searches) {
        if (await deleteStorageKey(search.selfieStorageKey)) {
          deletedSelfies += 1;
        }
      }

      await prisma.guestSession.delete({ where: { id: session.id } });
      deletedSessions += 1;
    }

    return {
      expiredEvents,
      deletedSessions,
      deletedSelfies,
      purgedSearches,
    };
  },

  async deleteGuestSessionData(sessionToken: string): Promise<{
    sessionsRemoved: number;
    selfiesRemoved: number;
  }> {
    const session = await prisma.guestSession.findUnique({
      where: { sessionToken },
      include: { searches: { select: { selfieStorageKey: true } } },
    });

    if (!session) {
      return { sessionsRemoved: 0, selfiesRemoved: 0 };
    }

    let selfiesRemoved = 0;
    for (const search of session.searches) {
      if (await deleteStorageKey(search.selfieStorageKey)) {
        selfiesRemoved += 1;
      }
    }

    await prisma.favorite.deleteMany({ where: { guestSessionId: session.id } });
    await prisma.download.deleteMany({ where: { guestSessionId: session.id } });
    await prisma.guestSession.delete({ where: { id: session.id } });

    return { sessionsRemoved: 1, selfiesRemoved };
  },
};
