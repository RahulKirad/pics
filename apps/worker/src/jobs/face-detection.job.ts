import type { Job } from 'bullmq';
import pino from 'pino';
import { detectFacesForPhoto } from '../services/face-pipeline.service.js';

const logger = pino({ name: 'face-detection' });

export async function handleFaceDetectionJob(job: Job<{ photoId: string }>): Promise<{ faceCount: number }> {
  const { photoId } = job.data;
  if (!photoId) {
    throw new Error('photoId is required');
  }

  logger.info({ jobId: job.id, photoId }, 'Detecting faces');
  const faceCount = await detectFacesForPhoto(photoId);
  logger.info({ jobId: job.id, photoId, faceCount }, 'Face detection complete');
  return { faceCount };
}
