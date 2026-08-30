import 'dotenv/config';
import { Worker, type Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import { loadEnv } from '@photo-platform/config';
import {
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_DEFINITIONS,
  QUEUE_NAMES,
  type QueueName,
} from '@photo-platform/queues';
import { connectDatabase } from './database/client.js';
import { handleImageProcessingJob } from './jobs/image-processing.job.js';
import { handleFaceDetectionJob } from './jobs/face-detection.job.js';
import { handleFaceEmbeddingJob } from './jobs/face-embedding.job.js';
import { handleVectorIndexingJob } from './jobs/vector-indexing.job.js';
import { handleGuestFaceSearchJob } from './jobs/guest-face-search.job.js';
import { handleCleanupJob } from './jobs/cleanup.job.js';

const env = loadEnv();
const logger = pino({ level: env.NODE_ENV === 'development' ? 'debug' : 'info' });

const JOB_HANDLERS: Partial<Record<QueueName, (job: Job) => Promise<unknown>>> = {
  'image-processing': handleImageProcessingJob,
  'face-detection': handleFaceDetectionJob,
  'face-embedding': handleFaceEmbeddingJob,
  'vector-indexing': handleVectorIndexingJob,
  'guest-face-search': handleGuestFaceSearchJob,
  cleanup: handleCleanupJob,
};

function createWorker(queueName: QueueName): Worker {
  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const handler = JOB_HANDLERS[queueName];
  const definition = QUEUE_DEFINITIONS[queueName];

  return new Worker(
    queueName,
    async (job) => {
      if (handler) {
        return handler(job);
      }
      logger.debug({ queue: queueName, jobId: job.id, name: job.name }, 'Stub job handler');
      return { processed: true, queue: queueName, stub: true };
    },
    {
      connection,
      concurrency: definition.concurrency,
      settings: {
        backoffStrategy: (attemptsMade) => {
          const base = DEFAULT_JOB_OPTIONS.backoff.delay;
          return Math.min(base * 2 ** (attemptsMade - 1), 60_000);
        },
      },
    },
  );
}

async function startWorkers(): Promise<void> {
  logger.info('Starting worker process');
  await connectDatabase();
  logger.info('Database connected');

  const workers = QUEUE_NAMES.map((name) => {
    const worker = createWorker(name);

    worker.on('completed', (job) => {
      logger.info(
        { queue: name, jobId: job.id, name: job.name, attempts: job.attemptsMade },
        'Job completed',
      );
    });

    worker.on('failed', (job, err) => {
      logger.error(
        {
          queue: name,
          jobId: job?.id,
          name: job?.name,
          attempts: job?.attemptsMade,
          err,
        },
        'Job failed',
      );
    });

    worker.on('error', (err) => {
      logger.error({ queue: name, err }, 'Worker error');
    });

    return worker;
  });

  const implemented = QUEUE_NAMES.filter((name) => QUEUE_DEFINITIONS[name].implemented);
  logger.info({ queues: QUEUE_NAMES.length, implemented }, 'Workers registered');

  try {
    const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    const cleanupQueue = new Queue('cleanup', { connection });
    await cleanupQueue.add(
      JOB_NAMES.RUN_CLEANUP,
      { triggeredBy: 'schedule' },
      { repeat: { pattern: '0 * * * *' }, jobId: 'cleanup-hourly' },
    );
    await cleanupQueue.close();
    await connection.quit();
    logger.info('Scheduled hourly privacy cleanup job');
  } catch (error) {
    logger.warn({ err: error }, 'Failed to schedule privacy cleanup job');
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down workers');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorkers().catch((error) => {
  logger.error({ err: error }, 'Worker startup failed');
  process.exit(1);
});
