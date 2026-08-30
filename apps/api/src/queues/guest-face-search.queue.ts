import { JOB_NAMES } from '@photo-platform/queues';
import { logger } from '../config/logger.js';
import { addQueueJob } from './queue-manager.js';

export async function enqueueGuestFaceSearch(guestSearchId: string): Promise<void> {
  try {
    await addQueueJob(
      'guest-face-search',
      JOB_NAMES.GUEST_FACE_SEARCH,
      { guestSearchId },
      { jobId: `guest-search-${guestSearchId}` },
    );
    logger.debug({ guestSearchId }, 'Enqueued guest face search job');
  } catch (error) {
    logger.warn({ err: error, guestSearchId }, 'Failed to enqueue guest face search');
    throw error;
  }
}
