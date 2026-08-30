import type { Job } from 'bullmq';
import pino from 'pino';
import { processPhotoJob } from '../processing/setup.js';
import { enqueueFaceDetection } from '../queues/enqueue.js';

const logger = pino({ name: 'image-processing' });

export async function handleImageProcessingJob(job: Job<{ photoId: string }>): Promise<void> {
  const { photoId } = job.data;
  if (!photoId) {
    throw new Error('photoId is required');
  }

  logger.info({ jobId: job.id, photoId }, 'Processing photo');
  await processPhotoJob(photoId);
  await enqueueFaceDetection(photoId);
  logger.info({ jobId: job.id, photoId }, 'Photo processing complete');
}
