import {
  processPhotoById,
  type ProcessingContext,
  type ProcessingDatabase,
  type ProcessingStorage,
  type UsageTracker,
} from '@photo-platform/image-processing';
import type { StorageDriver } from '@prisma/client';
import { prisma } from '../database/client.js';
import { getStorageProvider } from '../storage/storage.factory.js';

function createStorageAdapter(): ProcessingStorage {
  const storage = getStorageProvider();

  return {
    async download(key: string): Promise<Buffer> {
      const stream = await storage.download(key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },

    async upload(key: string, buffer: Buffer, mimeType: string): Promise<number> {
      const meta = await storage.upload(key, buffer, { mimeType, size: buffer.length });
      return meta.size;
    },
  };
}

function createDatabaseAdapter(): ProcessingDatabase {
  return {
    async getPhoto(photoId: string) {
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: {
          event: { select: { name: true, business: { select: { name: true } } } },
        },
      });

      if (!photo) return null;

      return {
        id: photo.id,
        eventId: photo.eventId,
        businessId: photo.businessId,
        storageDriver: photo.storageDriver as unknown as import('@photo-platform/shared-types').StorageDriver,
        storageKey: photo.storageKey,
        status: photo.status,
        eventName: photo.event.name,
        businessName: photo.event.business?.name ?? null,
      };
    },

    async markFailed(photoId: string, error: string) {
      await prisma.photo.update({
        where: { id: photoId },
        data: { status: 'FAILED', processingError: error },
      });
    },

    async markReady(photoId, data) {
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'READY',
          processingError: null,
          width: data.width,
          height: data.height,
          thumbnailKey: data.thumbnailKey,
          previewKey: data.previewKey,
          watermarkedKey: data.watermarkedKey,
          aiProcessingKey: data.aiProcessingKey,
        },
      });
    },
  };
}

function createUsageAdapter(): UsageTracker {
  return {
    async increment(businessId, eventId, storageDriver, bytes, category) {
      const fieldMap = {
        preview: 'previewBytes',
        thumbnail: 'thumbnailBytes',
        watermark: 'watermarkBytes',
        ai: 'aiBytes',
      } as const;

      const field = fieldMap[category];

      const upsert = async (targetEventId: string | null) => {
        const existing = await prisma.storageUsage.findFirst({
          where: { businessId, eventId: targetEventId },
        });

        if (existing) {
          const current = existing[field] as bigint;
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
              eventId: targetEventId,
              storageDriver: storageDriver as StorageDriver,
              [field]: bytes,
              totalBytes: bytes,
            },
          });
        }
      };

      await upsert(eventId);
      await upsert(null);
    },
  };
}

export function createProcessingContext(): ProcessingContext {
  return {
    storage: createStorageAdapter(),
    database: createDatabaseAdapter(),
    usage: createUsageAdapter(),
  };
}

export async function processPhotoJob(photoId: string): Promise<void> {
  await processPhotoById(createProcessingContext(), photoId);
}
