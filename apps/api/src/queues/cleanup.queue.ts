import { JOB_NAMES } from '@photo-platform/queues';
import { addQueueJob, getQueue } from './queue-manager.js';

export async function enqueueCleanup(triggeredBy: 'admin' | 'schedule' | 'startup' = 'admin') {
  await addQueueJob(
    'cleanup',
    JOB_NAMES.RUN_CLEANUP,
    { triggeredBy },
    {
      jobId: `cleanup-${triggeredBy}-${Date.now()}`,
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  );
}

export async function scheduleRecurringCleanup() {
  const queue = getQueue('cleanup');
  await queue.add(
    JOB_NAMES.RUN_CLEANUP,
    { triggeredBy: 'schedule' },
    {
      repeat: { pattern: '0 * * * *' },
      jobId: 'cleanup-hourly',
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  );
}
