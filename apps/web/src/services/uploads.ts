import type { ApiResponse } from '@photo-platform/shared-types';
import { api } from './api';

export interface UploadSessionResponse {
  isDuplicate: boolean;
  existingPhotoId?: string;
  message?: string;
  sessionId?: string;
  uploadMode?: 'vps_chunked' | 's3_presigned' | 's3_multipart';
  chunkSize?: number;
  totalChunks?: number;
  presignedUrls?: string[];
  s3UploadId?: string;
  expiresAt?: string;
}

export const uploadsService = {
  async createSession(payload: {
    eventId: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    checksum: string;
    folderId?: string;
  }) {
    const { data } = await api.post<ApiResponse<UploadSessionResponse>>('/uploads/sessions', payload);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async uploadChunk(sessionId: string, chunkIndex: number, chunk: Blob) {
    const { data } = await api.put<ApiResponse<{ uploaded: boolean }>>(
      `/uploads/sessions/${sessionId}/chunks/${chunkIndex}`,
      chunk,
      { headers: { 'Content-Type': 'application/octet-stream' } },
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async completeUpload(sessionId: string, parts?: { partNumber: number; etag: string }[]) {
    const { data } = await api.post<ApiResponse<{ photoId: string }>>(
      `/uploads/sessions/${sessionId}/complete`,
      { parts },
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async cancelUpload(sessionId: string) {
    await api.delete(`/uploads/sessions/${sessionId}`);
  },

  async uploadFile(
    file: File,
    eventId: string,
    onProgress?: (progress: number) => void,
    folderId?: string,
  ): Promise<{ photoId?: string; duplicate?: boolean }> {
    const { computeFileChecksum, CHUNK_SIZE } = await import('@/lib/upload-utils');
    const checksum = await computeFileChecksum(file);

    const session = await uploadsService.createSession({
      eventId,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      checksum,
      folderId,
    });

    if (session.isDuplicate) {
      return { duplicate: true, photoId: session.existingPhotoId };
    }

    const sessionId = session.sessionId!;

    if (session.uploadMode === 's3_presigned' && session.presignedUrls?.[0]) {
      await fetch(session.presignedUrls[0], {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      onProgress?.(100);
    } else if (session.uploadMode === 's3_multipart' && session.presignedUrls) {
      const parts: { partNumber: number; etag: string }[] = [];
      const chunkSize = session.chunkSize ?? CHUNK_SIZE;
      for (let i = 0; i < session.presignedUrls.length; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const response = await fetch(session.presignedUrls[i], {
          method: 'PUT',
          body: chunk,
        });
        const etag = response.headers.get('ETag')?.replace(/"/g, '') ?? '';
        parts.push({ partNumber: i + 1, etag });
        onProgress?.(Math.round(((i + 1) / session.presignedUrls.length) * 90));
      }
      const result = await uploadsService.completeUpload(sessionId, parts);
      onProgress?.(100);
      return { photoId: result.photoId };
    } else {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        await uploadsService.uploadChunk(sessionId, i, chunk);
        onProgress?.(Math.round(((i + 1) / totalChunks) * 90));
      }
    }

    const result = await uploadsService.completeUpload(sessionId);
    onProgress?.(100);
    return { photoId: result.photoId };
  },
};
