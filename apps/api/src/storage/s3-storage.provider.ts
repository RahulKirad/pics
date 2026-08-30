import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import type { StorageDriver } from '@prisma/client';
import { loadEnv } from '@photo-platform/config';
import { StorageError } from '../common/errors.js';
import type { StorageMetadata, StorageProvider, StorageUsageInfo, UploadSessionInfo, MultipartPart } from './types.js';
import { validateStorageKey } from './path-security.js';

export class S3StorageProvider implements StorageProvider {
  readonly driver: StorageDriver = 's3';
  private client: S3Client;
  private bucket: string;
  private cdnUrl?: string;

  constructor() {
    const env = loadEnv();
    if (!env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new StorageError('S3 credentials not configured', 'S3_NOT_CONFIGURED');
    }

    this.bucket = env.S3_BUCKET;
    this.cdnUrl = env.CDN_URL;

    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: !!env.S3_ENDPOINT,
    });
  }

  async upload(key: string, stream: Readable | Buffer, metadata: { mimeType: string; size?: number }): Promise<StorageMetadata> {
    validateStorageKey(key);
    const body = Buffer.isBuffer(stream) ? stream : stream;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: metadata.mimeType,
      }),
    );

    const head = await this.getMetadata(key);
    return head ?? { size: metadata.size ?? 0, mimeType: metadata.mimeType };
  }

  async download(key: string): Promise<Readable> {
    validateStorageKey(key);
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new StorageError('File not found', 'FILE_NOT_FOUND');
    }
    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    validateStorageKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    const meta = await this.getMetadata(key);
    return meta !== null;
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    validateStorageKey(key);
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        size: response.ContentLength ?? 0,
        mimeType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
      };
    } catch {
      return null;
    }
  }

  async getSignedUrl(key: string, options?: { expiresInSeconds?: number; contentType?: string }): Promise<string> {
    validateStorageKey(key);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options?.contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: options?.expiresInSeconds ?? 3600 });
  }

  getPublicUrl(key: string): string | null {
    if (this.cdnUrl) {
      return `${this.cdnUrl.replace(/\/$/, '')}/${key}`;
    }
    return null;
  }

  async createDirectory(): Promise<void> {
    // S3 has no directories
  }

  async getStorageUsage(prefix: string): Promise<StorageUsageInfo> {
    validateStorageKey(prefix);
    let totalBytes = 0;
    let fileCount = 0;
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of response.Contents ?? []) {
        totalBytes += obj.Size ?? 0;
        fileCount++;
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return { totalBytes, fileCount };
  }

  async createMultipartUpload(key: string, mimeType: string): Promise<UploadSessionInfo> {
    validateStorageKey(key);
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      }),
    );
    if (!response.UploadId) {
      throw new StorageError('Failed to create multipart upload');
    }
    return {
      uploadId: response.UploadId,
      key,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async getPresignedPartUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
    validateStorageKey(key);
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async completeMultipart(key: string, _tempKey: string, parts?: MultipartPart[]): Promise<void> {
    validateStorageKey(key);
    if (!parts?.length) {
      throw new StorageError('No parts provided for multipart completion');
    }
    // uploadId stored in tempKey field for S3 sessions
    const uploadId = _tempKey;
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((p) => ({ ETag: p.etag, PartNumber: p.partNumber })),
        },
      }),
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );
  }
}
