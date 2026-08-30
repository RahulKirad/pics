import { getFaceVectorStore } from '@photo-platform/vector-store';
import { prisma } from '../database/client.js';

function parseEmbeddingVector(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid embedding vector');
  }
  return value.map((v) => Number(v));
}

export async function indexFaceEmbedding(faceEmbeddingId: string): Promise<void> {
  const record = await prisma.faceEmbedding.findUnique({
    where: { id: faceEmbeddingId },
  });

  if (!record) {
    throw new Error(`Face embedding not found: ${faceEmbeddingId}`);
  }

  if (!record.embeddingVector) {
    throw new Error(`Face embedding ${faceEmbeddingId} has no vector data`);
  }

  const vector = parseEmbeddingVector(record.embeddingVector);
  const store = getFaceVectorStore();

  await store.upsertPoint(record.qdrantPointId, vector, {
    photoFaceId: record.photoFaceId,
    photoId: record.photoId,
    eventId: record.eventId,
    businessId: record.businessId,
    modelVersion: record.modelVersion,
  });
}

export async function removePhotoVectors(photoId: string): Promise<void> {
  const store = getFaceVectorStore();
  await store.deleteByPhotoId(photoId);
}
