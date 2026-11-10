import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { extractPrimaryFaceEmbedding } from '@/lib/face/browser-face';
import { localDemo } from '@/lib/bolt/local-demo';
import { useAuthStore } from '@/stores/auth-store';
import { PhotoStatus } from '@/types/domain';
import { logDebug } from '@/lib/bolt/debug-log';

export const uploadsService = {
  async uploadFile(
    file: File,
    eventId: string,
    onProgress?: (progress: number) => void,
    _folderId?: string,
  ): Promise<{ photoId?: string; duplicate?: boolean }> {
    const ownerId = useAuthStore.getState().user?.id;
    if (!ownerId) throw new Error('Not signed in');

    onProgress?.(5);
    const embedding = await extractPrimaryFaceEmbedding(file);
    onProgress?.(35);

    if (!getBoltEnv().configured) {
      const photo = await localDemo.addPhoto(ownerId, eventId, file, embedding);
      onProgress?.(100);
      return { photoId: photo.id };
    }

    const env = getBoltEnv();
    const supabase = getBoltClient()!;
    const photoId = crypto.randomUUID();
    const storagePath = `${ownerId}/${eventId}/${photoId}.jpg`;

    onProgress?.(50);
    const { error: uploadError } = await supabase.storage.from(env.bucket).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });
    if (uploadError) {
      logDebug('error', 'Storage upload failed', { error: uploadError, context: { storagePath } });
      throw uploadError;
    }
    onProgress?.(75);

    const { error: rowError } = await supabase.from('photos').insert({
      id: photoId,
      event_id: eventId,
      owner_id: ownerId,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      status: PhotoStatus.READY,
    });
    if (rowError) throw rowError;

    const { error: faceError } = await supabase.rpc('store_photo_embeddings', {
      p_photo_id: photoId,
      p_embeddings: [embedding],
    });
    if (faceError) {
      logDebug('error', 'store_photo_embeddings failed', { error: faceError, context: { photoId } });
      throw faceError;
    }

    onProgress?.(100);
    return { photoId };
  },
};
