import type { PaginatedResponse, PhotoSummary } from '@/types/domain';
import { PhotoStatus } from '@/types/domain';
import { getBoltClient, publicPhotoUrl } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { localDemo } from '@/lib/bolt/local-demo';

function mapPhoto(row: Record<string, unknown>): PhotoSummary {
  const storagePath = String(row.storage_path ?? '');
  const publicUrl = publicPhotoUrl(storagePath);
  return {
    id: String(row.id),
    originalName: String(row.original_name ?? 'photo.jpg'),
    mimeType: String(row.mime_type ?? 'image/jpeg'),
    fileSize: Number(row.file_size ?? 0),
    status: (row.status as PhotoSummary['status']) ?? PhotoStatus.READY,
    width: (row.width as number) ?? null,
    height: (row.height as number) ?? null,
    thumbnailUrl: publicUrl,
    previewUrl: publicUrl,
    processingError: (row.processing_error as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export const photosService = {
  async listByEvent(eventId: string, _cursor?: string): Promise<PaginatedResponse<PhotoSummary>> {
    if (!getBoltEnv().configured) {
      return localDemo.listPhotos(eventId);
    }
    const { data, error } = await getBoltClient()!
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return {
      items: (data ?? []).map((row) => mapPhoto(row as Record<string, unknown>)),
      hasMore: false,
      nextCursor: null,
    };
  },

  async retryProcessing(_photoId: string) {
    return { photoId: _photoId, status: PhotoStatus.READY };
  },
};
