import {
  processPhotoById,
  type ProcessingContext,
  type ProcessingDatabase,
  type ProcessingStorage,
  type UsageTracker,
} from '@photo-platform/image-processing';
import type { StorageDriver } from '@prisma/client';
import { NotFoundError } from '../common/errors.js';
import { prisma } from '../database/client.js';
import { getStorageProvider } from '../storage/storage.factory.js';
import { storageUsageService } from '../modules/storage/storage-usage.service.js';
import { logger } from '../config/logger.js';

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
      await storageUsageService.incrementUsage(
        businessId,
        eventId,
        storageDriver as StorageDriver,
        bytes,
        category,
      );
    },
  };
}

function createContext(): ProcessingContext {
  return {
    storage: createStorageAdapter(),
    database: createDatabaseAdapter(),
    usage: createUsageAdapter(),
  };
}

export const photoProcessingService = {
  async processPhoto(photoId: string): Promise<void> {
    await processPhotoById(createContext(), photoId);
  },

  async scheduleProcessing(photoId: string): Promise<void> {
    const { enqueuePhotoProcessing } = await import('../queues/image-processing.queue.js');
    await enqueuePhotoProcessing(photoId);
  },

  async retryProcessing(photoId: string, businessId: string): Promise<void> {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, businessId },
    });
    if (!photo) {
      throw new NotFoundError('Photo not found');
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: { status: 'PROCESSING', processingError: null },
    });

    await this.scheduleProcessing(photoId);
  },
};

export async function runInlineProcessing(photoId: string): Promise<void> {
  try {
    await photoProcessingService.processPhoto(photoId);
  } catch (error) {
    logger.error({ err: error, photoId }, 'Inline photo processing failed');
  }
}
