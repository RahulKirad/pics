import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync, readdirSync, unlinkSync } from 'fs';
import { mkdir, stat, unlink, readdir } from 'fs/promises';
import path from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { loadEnv } from '@photo-platform/config';
import type { StorageDriver } from '@prisma/client';
import { StorageError } from '../common/errors.js';
import type { StorageMetadata, StorageProvider, StorageUsageInfo } from './types.js';
import { resolveSafePath, validateStorageKey } from './path-security.js';

export class VpsStorageProvider implements StorageProvider {
  readonly driver: StorageDriver = 'vps';

  private getRoot(): string {
    return path.resolve(loadEnv().STORAGE_ROOT);
  }

  async upload(key: string, stream: Readable | Buffer, metadata: { mimeType: string; size?: number }): Promise<StorageMetadata> {
    validateStorageKey(key);
    const filePath = resolveSafePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });

    if (Buffer.isBuffer(stream)) {
      const { writeFile } = await import('fs/promises');
      await writeFile(filePath, stream);
    } else {
      await pipeline(stream, createWriteStream(filePath));
    }

    const fileStat = await stat(filePath);
    return { size: fileStat.size, mimeType: metadata.mimeType, lastModified: fileStat.mtime };
  }

  async download(key: string): Promise<Readable> {
    validateStorageKey(key);
    const filePath = resolveSafePath(key);
    if (!existsSync(filePath)) {
      throw new StorageError('File not found', 'FILE_NOT_FOUND');
    }
    return createReadStream(filePath);
  }

  async delete(key: string): Promise<void> {
    validateStorageKey(key);
    const filePath = resolveSafePath(key);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist
    }
  }

  async exists(key: string): Promise<boolean> {
    validateStorageKey(key);
    const filePath = resolveSafePath(key);
    return existsSync(filePath);
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    validateStorageKey(key);
    const filePath = resolveSafePath(key);
    try {
      const fileStat = await stat(filePath);
      return { size: fileStat.size, lastModified: fileStat.mtime };
    } catch {
      return null;
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/api/v1/storage/file?key=${encodeURIComponent(key)}`;
  }

  getPublicUrl(): string | null {
    return null;
  }

  async createDirectory(key: string): Promise<void> {
    validateStorageKey(key);
    const dirPath = resolveSafePath(key);
    await mkdir(dirPath, { recursive: true });
  }

  async getStorageUsage(prefix: string): Promise<StorageUsageInfo> {
    validateStorageKey(prefix);
    const dirPath = resolveSafePath(prefix);
    if (!existsSync(dirPath)) {
      return { totalBytes: 0, fileCount: 0 };
    }

    let totalBytes = 0;
    let fileCount = 0;

    const walk = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          totalBytes += statSync(full).size;
          fileCount++;
        }
      }
    };

    walk(dirPath);
    return { totalBytes, fileCount };
  }

  async appendChunk(tempKey: string, chunkIndex: number, stream: Readable | Buffer): Promise<void> {
    validateStorageKey(tempKey);
    const filePath = resolveSafePath(tempKey);
    await mkdir(path.dirname(filePath), { recursive: true });

    const chunkPath = `${filePath}.part${chunkIndex}`;
    if (Buffer.isBuffer(stream)) {
      const { writeFile } = await import('fs/promises');
      await writeFile(chunkPath, stream);
    } else {
      await pipeline(stream, createWriteStream(chunkPath));
    }
  }

  async completeMultipart(key: string, tempKey: string): Promise<void> {
    validateStorageKey(key);
    validateStorageKey(tempKey);
    const destPath = resolveSafePath(key);
    const tempPath = resolveSafePath(tempKey);
    const tempDir = path.dirname(tempPath);
    const baseName = path.basename(tempPath);

    await mkdir(path.dirname(destPath), { recursive: true });

    const parts = (await readdir(tempDir))
      .filter((f) => f.startsWith(`${baseName}.part`))
      .sort((a, b) => {
        const numA = parseInt(a.split('.part')[1] ?? '0', 10);
        const numB = parseInt(b.split('.part')[1] ?? '0', 10);
        return numA - numB;
      });

    const fs = await import('fs/promises');
    const fd = await fs.open(destPath, 'w');
    let position = 0;

    for (const part of parts) {
      const partPath = path.join(tempDir, part);
      const partData = await fs.readFile(partPath);
      await fd.write(partData, 0, partData.length, position);
      position += partData.length;
      await fs.unlink(partPath);
    }

    await fd.close();

    // Clean up temp marker file if exists
    try {
      await unlink(tempPath);
    } catch {
      // ignore
    }
  }
}
