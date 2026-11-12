import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { extractFaceEmbeddingsFromBlob } from '@/lib/face/browser-face';
import { localDemo } from '@/lib/bolt/local-demo';
import { useAuthStore } from '@/stores/auth-store';
import { PhotoStatus } from '@/types/domain';
import { logDebug } from '@/lib/bolt/debug-log';

export type UploadFileResult = {
  photoId?: string;
  duplicate?: boolean;
  facesDetected: number;
};

const NO_FACES_NOTE =
  'Photo saved. No faces were indexed from this image — guest matching may skip it.';

export const uploadsService = {
  async uploadFile(
    file: File,
    eventId: string,
    onProgress?: (progress: number) => void,
    _folderId?: string,
  ): Promise<UploadFileResult> {
    const ownerId = useAuthStore.getState().user?.id;
    if (!ownerId) throw new Error('Not signed in');

    onProgress?.(8);

    if (!getBoltEnv().configured) {
      let embeddings: number[][] = [];
      try {
        embeddings = await extractFaceEmbeddingsFromBlob(file);
      } catch (err) {
        logDebug('warn', 'Face indexing failed (demo)', { error: err, context: { file: file.name } });
      }
      onProgress?.(55);
      const photo = await localDemo.addPhoto(ownerId, eventId, file, embeddings);
      onProgress?.(100);
      return { photoId: photo.id, facesDetected: embeddings.length };
    }

    const env = getBoltEnv();
    const supabase = getBoltClient()!;
    const photoId = crypto.randomUUID();
    const storagePath = `${ownerId}/${eventId}/${photoId}.jpg`;

    onProgress?.(25);
    const { error: uploadError } = await supabase.storage.from(env.bucket).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });
    if (uploadError) {
      logDebug('error', 'Storage upload failed', { error: uploadError, context: { storagePath } });
      throw uploadError;
    }
    onProgress?.(45);

    let embeddings: number[][] = [];
    let processingError: string | null = null;
    try {
      embeddings = await extractFaceEmbeddingsFromBlob(file);
      if (embeddings.length === 0) processingError = NO_FACES_NOTE;
    } catch (err) {
      processingError =
        err instanceof Error ? err.message : 'Photo saved; face indexing failed — try re-uploading.';
      logDebug('warn', 'Face indexing failed', { error: err, context: { photoId, file: file.name } });
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
      processing_error: processingError,
    });
    if (rowError) throw rowError;

    if (embeddings.length > 0) {
      const { error: faceError } = await supabase.rpc('store_photo_embeddings', {
        p_photo_id: photoId,
        p_embeddings: embeddings,
      });
      if (faceError) {
        logDebug('error', 'store_photo_embeddings failed', { error: faceError, context: { photoId } });
        await supabase
          .from('photos')
          .update({ processing_error: 'Photo saved; could not store face data.' })
          .eq('id', photoId);
      }
    }

    onProgress?.(100);
    return { photoId, facesDetected: embeddings.length };
  },
};
