import { Queue, type JobsOptions } from 'bullmq';
import { loadEnv } from '@photo-platform/config';
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_NAMES,
  type QueueName,
} from '@photo-platform/queues';

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const env = loadEnv();
    queues.set(
      name,
      new Queue(name, {
        connection: { url: env.REDIS_URL },
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    );
  }
  return queues.get(name)!;
}

export function getAllQueues(): Queue[] {
  return QUEUE_NAMES.map((name) => getQueue(name));
}

export async function addQueueJob<T>(
  queueName: QueueName,
  jobName: string,
  data: T,
  options?: JobsOptions,
) {
  const queue = getQueue(queueName);
  return queue.add(jobName, data, options);
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
