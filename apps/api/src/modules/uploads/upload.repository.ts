import { prisma } from '../../database/client.js';
import type { UploadSessionStatus, StorageDriver } from '@prisma/client';

export const uploadRepository = {
  async findDuplicatePhoto(eventId: string, checksum: string, fileSize: bigint) {
    return prisma.photo.findFirst({
      where: {
        eventId,
        checksum,
        fileSize,
        status: { not: 'FAILED' },
      },
    });
  },

  async createSession(data: {
    eventId: string;
    businessId: string;
    userId: string;
    originalName: string;
    mimeType: string;
    fileSize: bigint;
    checksum: string;
    storageDriver: StorageDriver;
    storageKey: string;
    tempKey?: string;
    folderId?: string;
    chunkSize: number;
    totalChunks: number;
    s3UploadId?: string;
    expiresAt: Date;
  }) {
    return prisma.uploadSession.create({ data });
  },

  async findSession(sessionId: string, businessId: string) {
    return prisma.uploadSession.findFirst({
      where: { id: sessionId, businessId },
    });
  },

  async updateSession(sessionId: string, data: {
    status?: UploadSessionStatus;
    uploadedChunks?: number;
    uploadedBytes?: bigint;
    photoId?: string;
    errorMessage?: string;
  }) {
    return prisma.uploadSession.update({
      where: { id: sessionId },
      data,
    });
  },

  async incrementChunkProgress(sessionId: string, chunkSize: number) {
    return prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        uploadedChunks: { increment: 1 },
        uploadedBytes: { increment: BigInt(chunkSize) },
        status: 'UPLOADING',
      },
    });
  },
};

export const photoRepository = {
  async create(data: {
    eventId: string;
    businessId: string;
    folderId?: string;
    originalName: string;
    mimeType: string;
    fileSize: bigint;
    checksum: string;
    storageDriver: StorageDriver;
    storageKey: string;
    uploadedBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const photo = await tx.photo.create({
        data: { ...data, status: 'PROCESSING' },
      });
      await tx.event.update({
        where: { id: data.eventId },
        data: { photoCount: { increment: 1 } },
      });
      return photo;
    });
  },

  async listByEvent(eventId: string, businessId: string, limit = 50, cursor?: string) {
    const photos = await prisma.photo.findMany({
      where: { eventId, businessId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        checksum: true,
        width: true,
        height: true,
        thumbnailKey: true,
        previewKey: true,
        processingError: true,
        createdAt: true,
      },
    });
    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, limit) : photos;
    return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
  },

  async findById(photoId: string, businessId: string) {
    return prisma.photo.findFirst({
      where: { id: photoId, businessId },
    });
  },
};
