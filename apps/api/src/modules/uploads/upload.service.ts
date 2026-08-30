import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import type { CreateUploadSessionInput, CompleteUploadInput } from '@photo-platform/validation';
import { loadEnv } from '@photo-platform/config';
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../../common/errors.js';
import { validateMimeType, validateFileSize, validateFileSignature } from '../../common/file-validation.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import {
  buildPhotoStorageKey,
  buildTempStorageKey,
  getExtensionFromMime,
} from '../../storage/key-builder.js';
import { CHUNK_SIZE } from '../../storage/types.js';
import { eventService } from '../events/event.service.js';
import { uploadRepository, photoRepository } from './upload.repository.js';
import { storageUsageService } from '../storage/storage-usage.service.js';
import { photoProcessingService } from '../../processing/photo-processing.service.js';
import { resolveSafePath } from '../../storage/path-security.js';

const SESSION_EXPIRY_HOURS = 24;

export const uploadService = {
  async createSession(
    businessId: string,
    userId: string,
    input: CreateUploadSessionInput,
  ) {
    const env = loadEnv();
    await eventService.assertEventAccess(input.eventId, businessId);

    const { quotaService } = await import('../billing/quota.service.js');
    await quotaService.assertCanUploadPhoto(businessId, input.fileSize);

    validateMimeType(input.mimeType);
    validateFileSize(input.fileSize, env.MAX_FILE_SIZE_MB);

    const duplicate = await uploadRepository.findDuplicatePhoto(
      input.eventId,
      input.checksum,
      BigInt(input.fileSize),
    );

    if (duplicate) {
      return {
        isDuplicate: true,
        existingPhotoId: duplicate.id,
        message: 'Already uploaded',
      };
    }

    const storage = getStorageProvider();
    const photoId = randomUUID();
    const extension = getExtensionFromMime(input.mimeType);
    const storageKey = buildPhotoStorageKey(businessId, input.eventId, photoId, extension);
    const tempKey = buildTempStorageKey(businessId, input.eventId, photoId);
    const totalChunks = Math.max(1, Math.ceil(input.fileSize / CHUNK_SIZE));
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    let s3UploadId: string | undefined;
    let presignedUrls: string[] | undefined;
    let uploadMode: 'vps_chunked' | 's3_presigned' | 's3_multipart' = 'vps_chunked';

    if (storage.driver === 's3') {
      if (input.fileSize <= CHUNK_SIZE) {
        uploadMode = 's3_presigned';
        const url = await storage.getSignedUrl(storageKey, {
          expiresInSeconds: 3600,
          contentType: input.mimeType,
        });
        presignedUrls = [url];
      } else if (storage.createMultipartUpload && storage.getPresignedPartUrl) {
        uploadMode = 's3_multipart';
        const multipart = await storage.createMultipartUpload(storageKey, input.mimeType);
        s3UploadId = multipart.uploadId;
        presignedUrls = await Promise.all(
          Array.from({ length: totalChunks }, (_, i) =>
            storage.getPresignedPartUrl!(storageKey, multipart.uploadId, i + 1),
          ),
        );
      }
    }

    const session = await uploadRepository.createSession({
      eventId: input.eventId,
      businessId,
      userId,
      originalName: input.originalName,
      mimeType: input.mimeType,
      fileSize: BigInt(input.fileSize),
      checksum: input.checksum,
      storageDriver: storage.driver,
      storageKey,
      tempKey: storage.driver === 'vps' ? tempKey : s3UploadId,
      folderId: input.folderId,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      s3UploadId,
      expiresAt,
    });

    return {
      isDuplicate: false,
      sessionId: session.id,
      uploadMode,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      storageKey,
      presignedUrls,
      s3UploadId,
      expiresAt: session.expiresAt.toISOString(),
    };
  },

  async uploadChunk(
    sessionId: string,
    businessId: string,
    chunkIndex: number,
    buffer: Buffer,
  ) {
    const session = await uploadRepository.findSession(sessionId, businessId);
    if (!session) throw new NotFoundError('Upload session not found');
    if (session.status === 'COMPLETED' || session.status === 'DUPLICATE') {
      throw new ForbiddenError('Upload session already completed');
    }
    if (session.expiresAt < new Date()) {
      throw new ForbiddenError('Upload session expired');
    }
    if (session.storageDriver !== 'vps') {
      throw new ForbiddenError('Chunk upload only supported for VPS storage');
    }
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new ValidationError('Invalid chunk index');
    }

    const storage = getStorageProvider('vps');
    if (!session.tempKey || !storage.appendChunk) {
      throw new ForbiddenError('Invalid upload session configuration');
    }

    // Validate file signature on first chunk
    if (chunkIndex === 0) {
      const mime = validateMimeType(session.mimeType);
      if (!validateFileSignature(buffer.subarray(0, 12), mime)) {
        throw new ValidationError('File content does not match declared type', 'INVALID_FILE_SIGNATURE');
      }
    }

    await storage.appendChunk(session.tempKey, chunkIndex, buffer);
    await uploadRepository.incrementChunkProgress(sessionId, buffer.length);

    return {
      chunkIndex,
      uploaded: true,
      uploadedChunks: session.uploadedChunks + 1,
      totalChunks: session.totalChunks,
    };
  },

  async completeUpload(
    sessionId: string,
    businessId: string,
    userId: string,
    input: CompleteUploadInput,
  ) {
    const session = await uploadRepository.findSession(sessionId, businessId);
    if (!session) throw new NotFoundError('Upload session not found');
    if (session.expiresAt < new Date()) {
      throw new ForbiddenError('Upload session expired');
    }
    if (session.status === 'COMPLETED') {
      return { photoId: session.photoId, alreadyCompleted: true };
    }

    const storage = getStorageProvider(session.storageDriver);

    if (session.storageDriver === 'vps') {
      if (session.uploadedChunks < session.totalChunks) {
        throw new ValidationError('Not all chunks uploaded');
      }
      if (!session.tempKey || !storage.completeMultipart) {
        throw new ForbiddenError('Invalid VPS session');
      }
      await storage.completeMultipart(session.storageKey, session.tempKey);
    } else if (session.storageDriver === 's3') {
      const exists = await storage.exists(session.storageKey);
      if (!exists && session.s3UploadId && storage.completeMultipart && input.parts?.length) {
        await storage.completeMultipart(session.storageKey, session.s3UploadId, input.parts);
      } else if (!exists) {
        throw new ValidationError('File not found in storage. Upload may have failed.');
      }
    }

    const meta = await storage.getMetadata(session.storageKey);
    if (!meta) {
      throw new ValidationError('Uploaded file verification failed');
    }

    const photo = await photoRepository.create({
      eventId: session.eventId,
      businessId: session.businessId,
      folderId: session.folderId ?? undefined,
      originalName: session.originalName,
      mimeType: session.mimeType,
      fileSize: session.fileSize,
      checksum: session.checksum,
      storageDriver: session.storageDriver,
      storageKey: session.storageKey,
      uploadedBy: userId,
    });

    await storageUsageService.incrementUsage(
      session.businessId,
      session.eventId,
      session.storageDriver,
      session.fileSize,
      'original',
    );

    await uploadRepository.updateSession(sessionId, {
      status: 'COMPLETED',
      photoId: photo.id,
    });

    await photoProcessingService.scheduleProcessing(photo.id);

    return {
      photoId: photo.id,
      status: photo.status,
      alreadyCompleted: false,
    };
  },

  async cancelUpload(sessionId: string, businessId: string) {
    const session = await uploadRepository.findSession(sessionId, businessId);
    if (!session) throw new NotFoundError('Upload session not found');

    const storage = getStorageProvider(session.storageDriver);
    if (session.tempKey && session.storageDriver === 'vps') {
      try {
        const { unlink } = await import('fs/promises');
        const tempPath = resolveSafePath(session.tempKey);
        await unlink(tempPath).catch(() => {});
      } catch {
        // ignore cleanup errors
      }
    }

    if (session.storageKey) {
      await storage.delete(session.storageKey).catch(() => {});
    }

    await uploadRepository.updateSession(sessionId, { status: 'CANCELLED' });
  },

  async getSession(sessionId: string, businessId: string) {
    const session = await uploadRepository.findSession(sessionId, businessId);
    if (!session) throw new NotFoundError('Upload session not found');
    return {
      id: session.id,
      status: session.status,
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      uploadedBytes: Number(session.uploadedBytes),
      fileSize: Number(session.fileSize),
      photoId: session.photoId,
      expiresAt: session.expiresAt.toISOString(),
    };
  },

  async listPhotos(eventId: string, businessId: string, cursor?: string) {
    await eventService.assertEventAccess(eventId, businessId);
    const result = await photoRepository.listByEvent(eventId, businessId, 50, cursor);

    const buildUrl = (key: string | null) =>
      key ? `/api/v1/storage/file?key=${encodeURIComponent(key)}` : null;

    return {
      items: result.items.map((p) => ({
        id: p.id,
        originalName: p.originalName,
        mimeType: p.mimeType,
        fileSize: Number(p.fileSize),
        status: p.status,
        width: p.width,
        height: p.height,
        thumbnailUrl: buildUrl(p.thumbnailKey),
        previewUrl: buildUrl(p.previewKey),
        processingError: p.processingError,
        createdAt: p.createdAt.toISOString(),
      })),
      meta: { cursor: result.nextCursor, hasMore: result.hasMore },
    };
  },
};
