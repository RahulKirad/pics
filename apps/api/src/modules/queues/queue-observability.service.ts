import type { Job } from 'bullmq';
import type { QueueJobState, QueueJobSummary, QueueOverview, QueueStats } from '@photo-platform/shared-types';
import { QUEUE_DEFINITIONS, QUEUE_NAMES, type QueueName } from '@photo-platform/queues';
import { checkRedisHealth } from '../../database/redis.js';
import { getQueue } from '../../queues/queue-manager.js';

const JOB_STATE_MAP: Record<string, QueueJobState> = {
  waiting: 'waiting',
  active: 'active',
  completed: 'completed',
  failed: 'failed',
  delayed: 'delayed',
  paused: 'paused',
  'waiting-children': 'waiting',
};

function serializeJob(job: Job, queueName: QueueName, state: QueueJobState): QueueJobSummary {
  return {
    id: job.id ?? 'unknown',
    name: job.name,
    queue: queueName,
    state,
    attemptsMade: job.attemptsMade,
    maxAttempts: job.opts.attempts ?? 1,
    failedReason: job.failedReason ?? null,
    timestamp: new Date(job.timestamp).toISOString(),
    processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
    finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    data: (job.data ?? {}) as Record<string, unknown>,
  };
}

function isQueueName(value: string): value is QueueName {
  return (QUEUE_NAMES as readonly string[]).includes(value);
}

export const queueObservabilityService = {
  async getOverview(): Promise<QueueOverview> {
    const redisHealth = await checkRedisHealth();
    const redisConnected = redisHealth.status === 'healthy';

    const queues: QueueStats[] = [];
    const totals = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

    if (redisConnected) {
      for (const name of QUEUE_NAMES) {
        const definition = QUEUE_DEFINITIONS[name];
        const queue = getQueue(name);
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused',
        );

        const stats: QueueStats = {
          name,
          description: definition.description,
          implemented: definition.implemented,
          concurrency: definition.concurrency,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
          paused: counts.paused ?? 0,
        };

        queues.push(stats);
        totals.waiting += stats.waiting;
        totals.active += stats.active;
        totals.completed += stats.completed;
        totals.failed += stats.failed;
        totals.delayed += stats.delayed;
      }
    } else {
      for (const name of QUEUE_NAMES) {
        const definition = QUEUE_DEFINITIONS[name];
        queues.push({
          name,
          description: definition.description,
          implemented: definition.implemented,
          concurrency: definition.concurrency,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        });
      }
    }

    return { redisConnected, queues, totals };
  },

  async listJobs(queueName: string, state: QueueJobState = 'failed', start = 0, end = 19) {
    if (!isQueueName(queueName)) {
      throw new Error('Invalid queue name');
    }

    const queue = getQueue(queueName);
    const jobs = await queue.getJobs([state], start, end, true);
    return jobs.map((job: Job) => serializeJob(job, queueName, state));
  },

  async retryJob(queueName: string, jobId: string) {
    if (!isQueueName(queueName)) {
      throw new Error('Invalid queue name');
    }

    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();
    return { jobId, queue: queueName, status: 'retried' };
  },

  async removeJob(queueName: string, jobId: string) {
    if (!isQueueName(queueName)) {
      throw new Error('Invalid queue name');
    }

    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    return { jobId, queue: queueName, status: 'removed' };
  },
};
