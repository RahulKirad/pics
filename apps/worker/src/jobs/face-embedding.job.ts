import type { Job } from 'bullmq';
import pino from 'pino';
import { generateEmbeddingForFace } from '../services/face-pipeline.service.js';

const logger = pino({ name: 'face-embedding' });

export async function handleFaceEmbeddingJob(job: Job<{ photoFaceId: string }>): Promise<{ photoFaceId: string }> {
  const { photoFaceId } = job.data;
  if (!photoFaceId) {
    throw new Error('photoFaceId is required');
  }

  logger.info({ jobId: job.id, photoFaceId }, 'Generating face embedding');
  await generateEmbeddingForFace(photoFaceId);
  logger.info({ jobId: job.id, photoFaceId }, 'Face embedding complete');
  return { photoFaceId };
}
