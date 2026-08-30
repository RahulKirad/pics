import { Queue } from 'bullmq';
import { loadEnv } from '@photo-platform/config';
import { DEFAULT_JOB_OPTIONS, JOB_NAMES, type QueueName } from '@photo-platform/queues';

const queues = new Map<QueueName, Queue>();

function getQueue(name: QueueName): Queue {
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

export async function enqueueFaceDetection(photoId: string): Promise<void> {
  const queue = getQueue('face-detection');
  await queue.add(JOB_NAMES.DETECT_FACES, { photoId }, { jobId: `detect-${photoId}` });
}

export async function enqueueFaceEmbedding(photoFaceId: string): Promise<void> {
  const queue = getQueue('face-embedding');
  await queue.add(
    JOB_NAMES.GENERATE_EMBEDDING,
    { photoFaceId },
    { jobId: `embed-${photoFaceId}` },
  );
}

export async function enqueueVectorIndexing(faceEmbeddingId: string): Promise<void> {
  const queue = getQueue('vector-indexing');
  await queue.add(
    JOB_NAMES.INDEX_VECTOR,
    { faceEmbeddingId },
    { jobId: `index-${faceEmbeddingId}` },
  );
}

export async function enqueueGuestFaceSearch(guestSearchId: string): Promise<void> {
  const queue = getQueue('guest-face-search');
  await queue.add(
    JOB_NAMES.GUEST_FACE_SEARCH,
    { guestSearchId },
    { jobId: `guest-search-${guestSearchId}` },
  );
}
