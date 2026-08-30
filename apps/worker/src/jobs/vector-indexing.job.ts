import type { Job } from 'bullmq';
import pino from 'pino';
import { indexFaceEmbedding } from '../services/vector-indexing.service.js';

const logger = pino({ name: 'vector-indexing' });

export async function handleVectorIndexingJob(
  job: Job<{ faceEmbeddingId: string }>,
): Promise<{ faceEmbeddingId: string }> {
  const { faceEmbeddingId } = job.data;
  if (!faceEmbeddingId) {
    throw new Error('faceEmbeddingId is required');
  }

  logger.info({ jobId: job.id, faceEmbeddingId }, 'Indexing face vector');
  await indexFaceEmbedding(faceEmbeddingId);
  logger.info({ jobId: job.id, faceEmbeddingId }, 'Vector indexing complete');
  return { faceEmbeddingId };
}
