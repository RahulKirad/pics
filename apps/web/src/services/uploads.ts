import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { extractFacesWithCrops } from '@/lib/face/browser-face';
import { replacePhotoFaceRecords } from '@/lib/face/face-index';
import { localDemo } from '@/lib/bolt/local-demo';
import { useAuthStore } from '@/stores/auth-store';
import { PhotoStatus } from '@/types/domain';
import { logDebug } from '@/lib/bolt/debug-log';
import { embeddingsForStoreRpc } from '@/lib/bolt/vector-rpc';

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

    let faces: Awaited<ReturnType<typeof extractFacesWithCrops>> = [];
    try {
      faces = await extractFacesWithCrops(file);
    } catch (err) {
      logDebug('warn', 'Face indexing failed', { error: err, context: { file: file.name } });
    }
    const embeddings = faces.map((f) => f.embedding);
    onProgress?.(40);

    if (!getBoltEnv().configured) {
      onProgress?.(55);
      const photo = await localDemo.addPhoto(ownerId, eventId, file, embeddings);
      await replacePhotoFaceRecords(eventId, photo.id, faces);
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

    const processingError: string | null = faces.length === 0 ? NO_FACES_NOTE : null;
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
        p_embeddings: embeddingsForStoreRpc(embeddings),
      });
      if (faceError) {
        logDebug('error', 'store_photo_embeddings failed', { error: faceError, context: { photoId } });
        await supabase
          .from('photos')
          .update({ processing_error: 'Photo saved; could not store face data.' })
          .eq('id', photoId);
      }
    }

    await replacePhotoFaceRecords(eventId, photoId, faces);

    onProgress?.(100);
    return { photoId, facesDetected: embeddings.length };
  },
};
