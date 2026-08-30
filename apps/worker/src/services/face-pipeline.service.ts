import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { getFaceRecognitionProvider } from '@photo-platform/ai-client';
import type { BoundingBox } from '@photo-platform/shared-types';
import { prisma } from '../database/client.js';
import { getStorageProvider } from '../storage/storage.factory.js';
import { enqueueFaceEmbedding } from '../queues/enqueue.js';
import { removePhotoVectors } from './vector-indexing.service.js';

async function downloadImage(key: string): Promise<Buffer> {
  const storage = getStorageProvider();
  const stream = await storage.download(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function detectFacesForPhoto(photoId: string): Promise<number> {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new Error(`Photo not found: ${photoId}`);
  }

  if (!photo.aiProcessingKey) {
    throw new Error(`Photo ${photoId} has no AI processing image`);
  }

  const image = await downloadImage(photo.aiProcessingKey);
  const provider = getFaceRecognitionProvider();
  const detection = await provider.detectFaces(image, 'image/jpeg');

  const createdFaceIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.faceEmbedding.deleteMany({ where: { photoId } });
    await tx.photoFace.deleteMany({ where: { photoId } });

    for (const face of detection.faces) {
      const quality = await provider.checkQuality(image, {
        mimeType: 'image/jpeg',
        boundingBox: face.boundingBox,
      });

      if (!quality.passed) {
        continue;
      }

      const created = await tx.photoFace.create({
        data: {
          photoId: photo.id,
          eventId: photo.eventId,
          businessId: photo.businessId,
          boundingBox: face.boundingBox as unknown as Prisma.InputJsonValue,
          confidence: face.confidence,
          qualityScore: face.qualityScore ?? quality.score,
          landmarkData: (face.landmarks ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });

      createdFaceIds.push(created.id);
    }

    const faceCount = createdFaceIds.length;
    const delta = faceCount - photo.faceCount;

    await tx.photo.update({
      where: { id: photoId },
      data: { faceCount },
    });

    if (delta !== 0) {
      await tx.event.update({
        where: { id: photo.eventId },
        data: { faceCount: { increment: delta } },
      });
    }
  });

  await removePhotoVectors(photoId);

  for (const faceId of createdFaceIds) {
    await enqueueFaceEmbedding(faceId);
  }

  return createdFaceIds.length;
}

export async function generateEmbeddingForFace(photoFaceId: string): Promise<void> {
  const photoFace = await prisma.photoFace.findUnique({
    where: { id: photoFaceId },
    include: { photo: true, embedding: true },
  });

  if (!photoFace) {
    throw new Error(`Photo face not found: ${photoFaceId}`);
  }

  if (photoFace.embedding) {
    return;
  }

  const aiKey = photoFace.photo.aiProcessingKey;
  if (!aiKey) {
    throw new Error(`Photo ${photoFace.photoId} has no AI processing image`);
  }

  const image = await downloadImage(aiKey);
  const provider = getFaceRecognitionProvider();
  const boundingBox = photoFace.boundingBox as unknown as BoundingBox;

  const result = await provider.generateEmbedding(image, {
    mimeType: 'image/jpeg',
    boundingBox,
  });

  const qdrantPointId = randomUUID();

  const embedding = await prisma.faceEmbedding.create({
    data: {
      photoFaceId: photoFace.id,
      photoId: photoFace.photoId,
      eventId: photoFace.eventId,
      businessId: photoFace.businessId,
      qdrantPointId,
      modelVersion: result.modelVersion,
      embeddingVector: result.embedding,
    },
  });

  const { enqueueVectorIndexing } = await import('../queues/enqueue.js');
  await enqueueVectorIndexing(embedding.id);
}
