import path from 'path';
import { loadEnv } from '@photo-platform/config';
import { StorageError } from '../common/errors.js';

export function resolveSafePath(storageKey: string): string {
  const env = loadEnv();
  const root = path.resolve(env.STORAGE_ROOT);
  const fullPath = path.resolve(root, storageKey);

  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
    throw new StorageError('Invalid storage path', 'PATH_TRAVERSAL');
  }

  return fullPath;
}

export function validateStorageKey(storageKey: string): void {
  if (storageKey.includes('..') || storageKey.startsWith('/') || storageKey.includes('\\')) {
    throw new StorageError('Invalid storage key', 'INVALID_STORAGE_KEY');
  }
  if (!storageKey.startsWith('tenant_')) {
    throw new StorageError('Invalid storage key prefix', 'INVALID_STORAGE_KEY');
  }
}

export function isTenantStorageKey(storageKey: string, businessId: string): boolean {
  validateStorageKey(storageKey);
  return storageKey.startsWith(`tenant_${businessId}/`);
}
