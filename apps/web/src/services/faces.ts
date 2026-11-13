import type { FaceClusterSummary } from '@/lib/face/face-clusters';
import { clusterRecordsForUi } from '@/lib/face/face-clusters';
import { extractFacesWithCrops } from '@/lib/face/browser-face';
import { listFaceRecordsForEvent, replacePhotoFaceRecords } from '@/lib/face/face-index';
import { getDemoPhotoBlob } from '@/lib/bolt/demo-blobs';
import { getBoltEnv } from '@/lib/bolt/config';
import { getBoltClient, ownerPhotoUrl } from '@/lib/bolt/client';
import { localDemo } from '@/lib/bolt/local-demo';
import type { PhotoSummary } from '@/types/domain';
import { photosService } from '@/services/photos';

async function blobFromUrl(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load photo for face scan');
  return res.blob();
}

export const facesService = {
  async getClusters(eventId: string): Promise<FaceClusterSummary[]> {
    const records = await listFaceRecordsForEvent(eventId);
    return clusterRecordsForUi(records);
  },

  async getPhotosForCluster(
    eventId: string,
    clusterId: string,
    photoIds?: string[],
  ): Promise<PhotoSummary[]> {
    let ids = photoIds;
    if (!ids?.length) {
      const clusters = await this.getClusters(eventId);
      const cluster = clusters.find((c) => c.clusterId === clusterId);
      ids = cluster?.photoIds;
    }
    if (!ids?.length) return [];
    const all = await photosService.listByEvent(eventId);
    const idSet = new Set(ids);
    return all.items.filter((p) => idSet.has(p.id));
  },

  async rebuildEventIndex(eventId: string, onProgress?: (done: number, total: number) => void): Promise<void> {
    const { items } = await photosService.listByEvent(eventId);
    const total = items.length;
    for (let i = 0; i < items.length; i++) {
      const photo = items[i]!;
      let blob: Blob | null = null;
      if (!getBoltEnv().configured) {
        blob = await getDemoPhotoBlob(photo.id);
      } else {
        try {
          const url =
            photo.storagePath != null
              ? await ownerPhotoUrl(photo.storagePath)
              : photo.previewUrl;
          if (url) blob = await blobFromUrl(url);
        } catch {
          blob = null;
        }
      }
      if (blob) {
        try {
          const faces = await extractFacesWithCrops(blob);
          await replacePhotoFaceRecords(eventId, photo.id, faces);
        } catch {
          await replacePhotoFaceRecords(eventId, photo.id, []);
        }
      } else {
        await replacePhotoFaceRecords(eventId, photo.id, []);
      }
      onProgress?.(i + 1, total);
    }

    const records = await listFaceRecordsForEvent(eventId);
    if (!getBoltEnv().configured) {
      localDemo.syncFaceCount(eventId, records.length);
    } else {
      await getBoltClient()
        ?.from('events')
        .update({ face_count: records.length, updated_at: new Date().toISOString() })
        .eq('id', eventId);
    }
  },
};
