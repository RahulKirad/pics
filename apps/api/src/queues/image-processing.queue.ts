import { JOB_NAMES } from '@photo-platform/queues';
import { logger } from '../config/logger.js';
import { runInlineProcessing } from '../processing/photo-processing.service.js';
import { addQueueJob } from './queue-manager.js';

export async function enqueuePhotoProcessing(photoId: string): Promise<void> {
  try {
    await addQueueJob(
      'image-processing',
      JOB_NAMES.PROCESS_PHOTO,
      { photoId },
      { jobId: `photo-${photoId}` },
    );
    logger.debug({ photoId }, 'Enqueued photo processing job');
  } catch (error) {
    logger.warn({ err: error, photoId }, 'Failed to enqueue photo processing — running inline');
    void runInlineProcessing(photoId);
  }
}
