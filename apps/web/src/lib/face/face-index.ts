/** Per-face avatars + embeddings for event people gallery (IndexedDB). */

import type { FaceEmbedding } from '@/lib/face/browser-face';

export type FaceIndexRecord = {
  id: string;
  eventId: string;
  photoId: string;
  embedding: FaceEmbedding;
  avatarDataUrl: string;
};

const DB_NAME = 'picsharenow-face-index-v1';
const STORE = 'faces';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('by_event', 'eventId', { unique: false });
      store.createIndex('by_photo', 'photoId', { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function rid() {
  return crypto.randomUUID();
}

export async function replacePhotoFaceRecords(
  eventId: string,
  photoId: string,
  faces: Array<{ embedding: FaceEmbedding; avatarDataUrl: string }>,
): Promise<void> {
  await deleteFaceRecordsForPhoto(photoId);
  if (faces.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const face of faces) {
      store.put({
        id: rid(),
        eventId,
        photoId,
        embedding: face.embedding,
        avatarDataUrl: face.avatarDataUrl,
      } satisfies FaceIndexRecord);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
  db.close();
}

export async function deleteFaceRecordsForPhoto(photoId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const idx = store.index('by_photo');
    const req = idx.openCursor(IDBKeyRange.only(photoId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
  });
  db.close();
}

export async function listFaceRecordsForEvent(eventId: string): Promise<FaceIndexRecord[]> {
  const db = await openDb();
  const rows = await new Promise<FaceIndexRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('by_event');
    const req = idx.getAll(IDBKeyRange.only(eventId));
    req.onsuccess = () => resolve(req.result as FaceIndexRecord[]);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
  });
  db.close();
  return rows;
}
