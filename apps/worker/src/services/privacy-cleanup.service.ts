import type { CleanupRunResult } from '@photo-platform/shared-types';
import { prisma } from '../database/client.js';
import { getStorageProvider } from '../storage/storage.factory.js';

const DEFAULT_PRIVACY_SETTINGS = {
  guestSessionRetentionDays: 7,
  guestSelfieRetentionDays: 30,
  autoExpireEvents: true,
};

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

async function getPrivacySettings() {
  const stored = await prisma.systemSetting.findUnique({ where: { key: 'privacy.retention' } });
  if (!stored || typeof stored.value !== 'object' || stored.value === null) {
    return DEFAULT_PRIVACY_SETTINGS;
  }

  const value = stored.value as Record<string, unknown>;
  return {
    guestSessionRetentionDays:
      typeof value.guestSessionRetentionDays === 'number'
        ? value.guestSessionRetentionDays
        : DEFAULT_PRIVACY_SETTINGS.guestSessionRetentionDays,
    guestSelfieRetentionDays:
      typeof value.guestSelfieRetentionDays === 'number'
        ? value.guestSelfieRetentionDays
        : DEFAULT_PRIVACY_SETTINGS.guestSelfieRetentionDays,
    autoExpireEvents:
      typeof value.autoExpireEvents === 'boolean'
        ? value.autoExpireEvents
        : DEFAULT_PRIVACY_SETTINGS.autoExpireEvents,
  };
}

async function deleteStorageKey(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    await getStorageProvider().delete(key);
    return true;
  } catch {
    return false;
  }
}

export async function runPrivacyCleanup(now = new Date()): Promise<CleanupRunResult> {
  const settings = await getPrivacySettings();
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
      searches: { select: { selfieStorageKey: true } },
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
}
