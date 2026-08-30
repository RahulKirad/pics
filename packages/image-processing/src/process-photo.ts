import type { StorageDriver } from '@photo-platform/shared-types';
import { PhotoVariant } from '@photo-platform/shared-types';
import { processImageVariants } from './image-processor.js';
import { buildVariantKey } from './variant-keys.js';

export type UsageCategory = 'preview' | 'thumbnail' | 'watermark' | 'ai';

export interface PhotoRecord {
  id: string;
  eventId: string;
  businessId: string;
  storageDriver: StorageDriver;
  storageKey: string;
  status: string;
  eventName?: string | null;
  businessName?: string | null;
}

export interface ProcessingStorage {
  download(key: string): Promise<Buffer>;
  upload(key: string, buffer: Buffer, mimeType: string): Promise<number>;
}

export interface ProcessingDatabase {
  getPhoto(photoId: string): Promise<PhotoRecord | null>;
  markFailed(photoId: string, error: string): Promise<void>;
  markReady(photoId: string, data: {
    width: number;
    height: number;
    thumbnailKey: string;
    previewKey: string;
    watermarkedKey: string;
    aiProcessingKey: string;
  }): Promise<void>;
}

export interface UsageTracker {
  increment(
    businessId: string,
    eventId: string,
    storageDriver: StorageDriver,
    bytes: bigint,
    category: UsageCategory,
  ): Promise<void>;
}

export interface ProcessingContext {
  storage: ProcessingStorage;
  database: ProcessingDatabase;
  usage: UsageTracker;
}

export async function processPhotoById(ctx: ProcessingContext, photoId: string): Promise<void> {
  const photo = await ctx.database.getPhoto(photoId);
  if (!photo) {
    throw new Error(`Photo not found: ${photoId}`);
  }

  if (photo.status === 'READY') {
    return;
  }

  try {
    const original = await ctx.storage.download(photo.storageKey);
    const watermarkText = photo.eventName ?? photo.businessName ?? 'PhotoFlow';
    const variants = await processImageVariants(original, { watermarkText });

    const thumbnailKey = buildVariantKey(photo.businessId, photo.eventId, PhotoVariant.THUMBNAIL, photo.id);
    const previewKey = buildVariantKey(photo.businessId, photo.eventId, PhotoVariant.PREVIEW, photo.id);
    const watermarkedKey = buildVariantKey(photo.businessId, photo.eventId, PhotoVariant.WATERMARKED, photo.id);
    const aiProcessingKey = buildVariantKey(photo.businessId, photo.eventId, PhotoVariant.AI, photo.id);

    const mimeType = 'image/jpeg';
    const thumbnailBytes = await ctx.storage.upload(thumbnailKey, variants.thumbnail, mimeType);
    const previewBytes = await ctx.storage.upload(previewKey, variants.preview, mimeType);
    const watermarkedBytes = await ctx.storage.upload(watermarkedKey, variants.watermarked, mimeType);
    const aiBytes = await ctx.storage.upload(aiProcessingKey, variants.aiCopy, mimeType);

    await ctx.usage.increment(photo.businessId, photo.eventId, photo.storageDriver, BigInt(thumbnailBytes), 'thumbnail');
    await ctx.usage.increment(photo.businessId, photo.eventId, photo.storageDriver, BigInt(previewBytes), 'preview');
    await ctx.usage.increment(photo.businessId, photo.eventId, photo.storageDriver, BigInt(watermarkedBytes), 'watermark');
    await ctx.usage.increment(photo.businessId, photo.eventId, photo.storageDriver, BigInt(aiBytes), 'ai');

    await ctx.database.markReady(photo.id, {
      width: variants.width,
      height: variants.height,
      thumbnailKey,
      previewKey,
      watermarkedKey,
      aiProcessingKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image processing failed';
    await ctx.database.markFailed(photoId, message);
    throw error;
  }
}
