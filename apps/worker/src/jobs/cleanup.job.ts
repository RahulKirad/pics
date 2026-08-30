import type { Job } from 'bullmq';
import type { CleanupJobData } from '@photo-platform/queues';
import { runPrivacyCleanup } from '../services/privacy-cleanup.service.js';

export async function handleCleanupJob(job: Job<CleanupJobData>) {
  const result = await runPrivacyCleanup();
  return { ...result, triggeredBy: job.data.triggeredBy ?? 'schedule' };
}
