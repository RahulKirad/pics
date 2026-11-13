/** Persists uploaded image bytes in IndexedDB so previews survive page refresh (local demo). */

const DB_NAME = 'picsharenow-demo-v1';
const STORE = 'photo-blobs';

const previewUrlCache = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

export async function putDemoPhotoBlob(photoId: string, file: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
  db.close();
}

export async function getDemoPhotoBlob(photoId: string): Promise<Blob | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(photoId);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
  });
  db.close();
  return blob;
}

function cacheObjectUrl(photoId: string, blob: Blob): string {
  const previous = previewUrlCache.get(photoId);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(blob);
  previewUrlCache.set(photoId, url);
  return url;
}

export async function resolveDemoPhotoPreviewUrl(photoId: string): Promise<string | null> {
  const cached = previewUrlCache.get(photoId);
  if (cached) return cached;

  const blob = await getDemoPhotoBlob(photoId);
  if (!blob) return null;
  return cacheObjectUrl(photoId, blob);
}

export async function primeDemoPhotoPreview(photoId: string, file: Blob): Promise<string> {
  await putDemoPhotoBlob(photoId, file);
  return cacheObjectUrl(photoId, file);
}

export async function deleteDemoPhotoBlob(photoId: string): Promise<void> {
  const cached = previewUrlCache.get(photoId);
  if (cached) {
    URL.revokeObjectURL(cached);
    previewUrlCache.delete(photoId);
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
  });
  db.close();
}
