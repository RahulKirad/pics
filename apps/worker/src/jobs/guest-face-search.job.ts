import type { Job } from 'bullmq';
import pino from 'pino';
import { runGuestFaceSearch } from '../services/guest-face-search.service.js';

const logger = pino({ name: 'guest-face-search' });

export async function handleGuestFaceSearchJob(
  job: Job<{ guestSearchId: string }>,
): Promise<{ guestSearchId: string; matchCount: number }> {
  const { guestSearchId } = job.data;
  if (!guestSearchId) {
    throw new Error('guestSearchId is required');
  }

  logger.info({ jobId: job.id, guestSearchId }, 'Running guest face search');
  const result = await runGuestFaceSearch(guestSearchId);
  logger.info({ jobId: job.id, guestSearchId, matchCount: result.matchCount }, 'Guest face search complete');
  return { guestSearchId, matchCount: result.matchCount };
}
