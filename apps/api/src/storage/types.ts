import type { Readable } from 'stream';
import type { StorageDriver } from '@prisma/client';

export interface StorageMetadata {
  size: number;
  mimeType?: string;
  lastModified?: Date;
  etag?: string;
}

export interface StorageUsageInfo {
  totalBytes: number;
  fileCount: number;
}

export interface UploadSessionInfo {
  uploadId: string;
  key: string;
  expiresAt: Date;
}

export interface MultipartPart {
  partNumber: number;
  etag: string;
}

export interface StorageProvider {
  readonly driver: StorageDriver;

  upload(key: string, stream: Readable | Buffer, metadata: { mimeType: string; size?: number }): Promise<StorageMetadata>;

  download(key: string): Promise<Readable>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  getMetadata(key: string): Promise<StorageMetadata | null>;

  getSignedUrl(key: string, options?: { expiresInSeconds?: number; contentType?: string }): Promise<string>;

  getPublicUrl(key: string): string | null;

  createDirectory(key: string): Promise<void>;

  getStorageUsage(prefix: string): Promise<StorageUsageInfo>;

  /** Append chunk data to a temp upload path (VPS) or buffer part (S3) */
  appendChunk?(tempKey: string, chunkIndex: number, stream: Readable | Buffer): Promise<void>;

  /** Finalize multipart/chunked upload */
  completeMultipart?(key: string, tempKey: string, parts?: MultipartPart[]): Promise<void>;

  /** Create S3 multipart upload session */
  createMultipartUpload?(key: string, mimeType: string): Promise<UploadSessionInfo>;

  /** Get presigned URL for uploading a single part */
  getPresignedPartUrl?(key: string, uploadId: string, partNumber: number): Promise<string>;
}

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
