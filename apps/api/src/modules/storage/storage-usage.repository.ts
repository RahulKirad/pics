import { prisma } from '../../database/client.js';
import type { StorageDriver } from '@prisma/client';

type UsageCategory = 'original' | 'preview' | 'thumbnail' | 'watermark' | 'guestUpload' | 'temp' | 'ai';

const categoryField: Record<UsageCategory, string> = {
  original: 'originalBytes',
  preview: 'previewBytes',
  thumbnail: 'thumbnailBytes',
  watermark: 'watermarkBytes',
  guestUpload: 'guestUploadBytes',
  temp: 'tempBytes',
  ai: 'aiBytes',
};

async function upsertUsageRecord(
  businessId: string,
  eventId: string | null,
  storageDriver: StorageDriver,
  bytes: bigint,
  category: UsageCategory,
) {
  const field = categoryField[category];
  const existing = await prisma.storageUsage.findFirst({
    where: { businessId, eventId },
  });

  if (existing) {
    const current = existing[field as keyof typeof existing] as bigint;
    await prisma.storageUsage.update({
      where: { id: existing.id },
      data: {
        [field]: current + bytes,
        totalBytes: existing.totalBytes + bytes,
        lastCalculatedAt: new Date(),
      },
    });
  } else {
    await prisma.storageUsage.create({
      data: {
        businessId,
        eventId,
        storageDriver,
        [field]: bytes,
        totalBytes: bytes,
      },
    });
  }
}

export const storageUsageRepository = {
  async getBusinessUsage(businessId: string) {
    return prisma.storageUsage.findFirst({
      where: { businessId, eventId: null },
    });
  },

  async getEventUsage(businessId: string, eventId: string) {
    return prisma.storageUsage.findFirst({
      where: { businessId, eventId },
    });
  },

  async incrementUsage(
    businessId: string,
    eventId: string,
    storageDriver: StorageDriver,
    bytes: bigint,
    category: UsageCategory = 'original',
  ) {
    await upsertUsageRecord(businessId, eventId, storageDriver, bytes, category);
    await upsertUsageRecord(businessId, null, storageDriver, bytes, category);
  },

  async listByBusiness() {
    return prisma.storageUsage.findMany({
      where: { eventId: null },
      include: { business: { select: { id: true, name: true, slug: true } } },
      orderBy: { totalBytes: 'desc' },
    });
  },
};
