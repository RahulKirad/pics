import { loadEnv } from '@photo-platform/config';
import { prisma } from '../../database/client.js';
import { checkRedisHealth } from '../../database/redis.js';
import type { HealthCheckResult } from '@photo-platform/shared-types';

export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

export async function checkQdrantHealth() {
  const env = loadEnv();
  try {
    const start = Date.now();
    const response = await fetch(`${env.QDRANT_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return { status: 'unhealthy', message: `Qdrant returned ${response.status}` };
    }
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Qdrant connection failed',
    };
  }
}

export async function checkAiServiceHealth() {
  const env = loadEnv();
  try {
    const start = Date.now();
    const response = await fetch(`${env.AI_SERVICE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return { status: 'unhealthy', message: `AI service returned ${response.status}` };
    }
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'AI service connection failed',
    };
  }
}

export async function checkStorageHealth() {
  const env = loadEnv();
  if (env.STORAGE_DRIVER === 'vps') {
    try {
      const fs = await import('fs/promises');
      await fs.access(env.STORAGE_ROOT);
      return { status: 'healthy' };
    } catch {
      return { status: 'unhealthy', message: `Storage root not accessible: ${env.STORAGE_ROOT}` };
    }
  }
  return { status: 'healthy', message: 'S3 storage configured' };
}

export async function getPlatformHealth(): Promise<HealthCheckResult> {
  const [database, redis, qdrant, aiService, storage] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkQdrantHealth(),
    checkAiServiceHealth(),
    checkStorageHealth(),
  ]);

  const services = { database, redis, qdrant, aiService, storage };
  const allHealthy = Object.values(services).every((service) => service.status === 'healthy');
  const anyUnhealthy = Object.values(services).some((service) => service.status === 'unhealthy');

  return {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
  };
}
