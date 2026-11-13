import type { PaginatedResponse, PhotoSummary } from '@/types/domain';
import { PhotoStatus } from '@/types/domain';
import { getBoltClient, ownerPhotoUrl } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { logDebug } from '@/lib/bolt/debug-log';
import { deleteFaceRecordsForPhoto } from '@/lib/face/face-index';
import { localDemo } from '@/lib/bolt/local-demo';

async function mapPhoto(row: Record<string, unknown>): Promise<PhotoSummary> {
  const storagePath = String(row.storage_path ?? '');
  const previewUrl = await ownerPhotoUrl(storagePath);
  return {
    id: String(row.id),
    originalName: String(row.original_name ?? 'photo.jpg'),
    mimeType: String(row.mime_type ?? 'image/jpeg'),
    fileSize: Number(row.file_size ?? 0),
    status: (row.status as PhotoSummary['status']) ?? PhotoStatus.READY,
    width: (row.width as number) ?? null,
    height: (row.height as number) ?? null,
    thumbnailUrl: previewUrl,
    previewUrl,
    processingError: (row.processing_error as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    storagePath: storagePath || null,
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
    const items = await Promise.all((data ?? []).map((row) => mapPhoto(row as Record<string, unknown>)));
    return {
      items,
      hasMore: false,
      nextCursor: null,
    };
  },

  async retryProcessing(_photoId: string) {
    return { photoId: _photoId, status: PhotoStatus.READY };
  },

  async deletePhoto(photoId: string, eventId: string): Promise<void> {
    if (!getBoltEnv().configured) {
      await localDemo.deletePhoto(photoId, eventId);
      return;
    }

    const env = getBoltEnv();
    const supabase = getBoltClient()!;

    const { data: row, error: fetchError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!row) throw new Error('Photo not found');

    const { error: storageError } = await supabase.storage.from(env.bucket).remove([row.storage_path]);
    if (storageError) {
      logDebug('warn', 'Storage delete failed', { error: storageError, context: { photoId } });
    }

    const { error: deleteError } = await supabase.from('photos').delete().eq('id', photoId);
    if (deleteError) throw deleteError;
    await deleteFaceRecordsForPhoto(photoId);

    const { count: photoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    await supabase
      .from('events')
      .update({
        photo_count: photoCount ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);
  },
};
