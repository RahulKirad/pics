import type { StorageDriver } from '@prisma/client';
import { loadEnv } from '@photo-platform/config';
import type { StorageProvider } from './types.js';
import { VpsStorageProvider } from './vps-storage.provider.js';
import { S3StorageProvider } from './s3-storage.provider.js';

let cachedProvider: StorageProvider | null = null;
let cachedDriver: StorageDriver | null = null;

export function getStorageProvider(driver?: StorageDriver): StorageProvider {
  const env = loadEnv();
  const selectedDriver = driver ?? env.STORAGE_DRIVER;

  if (cachedProvider && cachedDriver === selectedDriver) {
    return cachedProvider;
  }

  cachedDriver = selectedDriver;
  cachedProvider = selectedDriver === 's3' ? new S3StorageProvider() : new VpsStorageProvider();
  return cachedProvider;
}

export function resetStorageProvider(): void {
  cachedProvider = null;
  cachedDriver = null;
}
