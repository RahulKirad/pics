export const QUEUE_NAMES = [
  'photo-upload',
  'image-processing',
  'thumbnail-generation',
  'preview-generation',
  'watermark-generation',
  'face-detection',
  'face-embedding',
  'vector-indexing',
  'guest-face-search',
  'cleanup',
  'storage-usage',
  'analytics',
  'notifications',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const QUEUE_DEFINITIONS: Record<
  QueueName,
  { description: string; concurrency: number; implemented: boolean }
> = {
  'photo-upload': { description: 'Upload completion handling', concurrency: 2, implemented: false },
  'image-processing': { description: 'Sharp image transformations', concurrency: 3, implemented: true },
  'thumbnail-generation': { description: 'Thumbnail creation', concurrency: 2, implemented: false },
  'preview-generation': { description: 'Preview creation', concurrency: 2, implemented: false },
  'watermark-generation': { description: 'Watermark application', concurrency: 2, implemented: false },
  'face-detection': { description: 'AI face detection', concurrency: 2, implemented: true },
  'face-embedding': { description: 'Face embedding generation', concurrency: 2, implemented: true },
  'vector-indexing': { description: 'Qdrant vector indexing', concurrency: 2, implemented: true },
  'guest-face-search': { description: 'Guest selfie matching', concurrency: 2, implemented: true },
  cleanup: { description: 'Retention and expiry cleanup', concurrency: 1, implemented: true },
  'storage-usage': { description: 'Background storage usage aggregation', concurrency: 1, implemented: false },
  analytics: { description: 'Metrics aggregation', concurrency: 1, implemented: false },
  notifications: { description: 'Email and push notifications', concurrency: 2, implemented: false },
};

export const JOB_NAMES = {
  PROCESS_PHOTO: 'process-photo',
  DETECT_FACES: 'detect-faces',
  GENERATE_EMBEDDING: 'generate-embedding',
  INDEX_VECTOR: 'index-vector',
  GUEST_FACE_SEARCH: 'guest-face-search',
  RUN_CLEANUP: 'run-cleanup',
} as const;
