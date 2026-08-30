import { storageUsageRepository } from './storage-usage.repository.js';

function serializeUsage(record: {
  originalBytes: bigint;
  previewBytes: bigint;
  thumbnailBytes: bigint;
  watermarkBytes: bigint;
  guestUploadBytes: bigint;
  tempBytes: bigint;
  aiBytes: bigint;
  totalBytes: bigint;
  lastCalculatedAt: Date;
  storageDriver: string;
}) {
  return {
    originalBytes: Number(record.originalBytes),
    previewBytes: Number(record.previewBytes),
    thumbnailBytes: Number(record.thumbnailBytes),
    watermarkBytes: Number(record.watermarkBytes),
    guestUploadBytes: Number(record.guestUploadBytes),
    tempBytes: Number(record.tempBytes),
    aiBytes: Number(record.aiBytes),
    totalBytes: Number(record.totalBytes),
    lastCalculatedAt: record.lastCalculatedAt.toISOString(),
    storageDriver: record.storageDriver,
  };
}

const emptyUsage = {
  originalBytes: 0,
  previewBytes: 0,
  thumbnailBytes: 0,
  watermarkBytes: 0,
  guestUploadBytes: 0,
  tempBytes: 0,
  aiBytes: 0,
  totalBytes: 0,
  lastCalculatedAt: null as string | null,
  storageDriver: null as string | null,
};

export const storageUsageService = {
  async getBusinessUsage(businessId: string) {
    const usage = await storageUsageRepository.getBusinessUsage(businessId);
    if (!usage) return emptyUsage;
    return serializeUsage(usage);
  },

  async getEventUsage(businessId: string, eventId: string) {
    const usage = await storageUsageRepository.getEventUsage(businessId, eventId);
    if (!usage) return null;
    return serializeUsage(usage);
  },

  async incrementUsage(
    businessId: string,
    eventId: string,
    storageDriver: import('@prisma/client').StorageDriver,
    bytes: bigint,
    category: 'original' | 'preview' | 'thumbnail' | 'watermark' | 'guestUpload' | 'temp' | 'ai' = 'original',
  ) {
    await storageUsageRepository.incrementUsage(businessId, eventId, storageDriver, bytes, category);
  },

  async listAllForAdmin() {
    const records = await storageUsageRepository.listByBusiness();
    return records.map((r) => ({
      business: r.business,
      ...serializeUsage(r),
    }));
  },
};
