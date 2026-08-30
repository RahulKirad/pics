import Redis from 'ioredis';
import { loadEnv } from '@photo-platform/config';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const env = loadEnv();
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function checkRedisHealth(): Promise<{ status: string; latencyMs?: number; message?: string }> {
  try {
    const client = getRedis();
    const start = Date.now();
    await client.ping();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}
