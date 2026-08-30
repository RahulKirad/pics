import { JOB_NAMES } from '@photo-platform/queues';
import { logger } from '../config/logger.js';
import { addQueueJob } from './queue-manager.js';

export async function enqueueFaceDetection(photoId: string): Promise<void> {
  try {
    await addQueueJob(
      'face-detection',
      JOB_NAMES.DETECT_FACES,
      { photoId },
      { jobId: `detect-${photoId}` },
    );
    logger.debug({ photoId }, 'Enqueued face detection job');
  } catch (error) {
    logger.warn({ err: error, photoId }, 'Failed to enqueue face detection');
  }
}
