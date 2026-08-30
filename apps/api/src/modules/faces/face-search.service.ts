import { getFaceVectorStore } from '@photo-platform/vector-store';
import { NotFoundError } from '../../common/errors.js';
import { eventService } from '../events/event.service.js';

function parseEmbeddingVector(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid embedding vector');
  }
  return value.map((v) => Number(v));
}

export const faceSearchService = {
  async searchByEmbedding(
    eventId: string,
    businessId: string,
    embedding: number[],
    threshold = 0.6,
    limit = 20,
  ) {
    await eventService.assertEventAccess(eventId, businessId);

    const store = getFaceVectorStore();
    const matches = await store.searchByEvent(eventId, embedding, { threshold, limit });

    return {
      matches,
      threshold,
      count: matches.length,
    };
  },

  async searchByFaceEmbeddingId(
    eventId: string,
    businessId: string,
    faceEmbeddingId: string,
    threshold = 0.6,
    limit = 20,
  ) {
    const { prisma } = await import('../../database/client.js');
    await eventService.assertEventAccess(eventId, businessId);

    const record = await prisma.faceEmbedding.findFirst({
      where: { id: faceEmbeddingId, eventId, businessId },
    });

    if (!record?.embeddingVector) {
      throw new NotFoundError('Face embedding not found');
    }

    const embedding = parseEmbeddingVector(record.embeddingVector);
    return this.searchByEmbedding(eventId, businessId, embedding, threshold, limit);
  },
};
