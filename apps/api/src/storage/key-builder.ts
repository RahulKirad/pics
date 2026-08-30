import { PhotoVariant } from '@photo-platform/shared-types';

export function buildStorageKey(
  businessId: string,
  eventId: string,
  variant: PhotoVariant | string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `tenant_${businessId}/event_${eventId}/${variant}/${safeName}`;
}

export function buildPhotoStorageKey(
  businessId: string,
  eventId: string,
  photoId: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, '').toLowerCase();
  return buildStorageKey(businessId, eventId, PhotoVariant.ORIGINAL, `${photoId}.${ext}`);
}

export function buildTempStorageKey(
  businessId: string,
  eventId: string,
  sessionId: string,
): string {
  return buildStorageKey(businessId, eventId, PhotoVariant.TEMP, `${sessionId}.upload`);
}

export function buildGuestSelfieStorageKey(
  businessId: string,
  eventId: string,
  searchId: string,
  extension: string,
): string {
  const ext = extension.replace(/^\./, '').toLowerCase();
  return buildStorageKey(businessId, eventId, PhotoVariant.TEMP, `guest_selfie_${searchId}.${ext}`);
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'bin';
}

export function getExtensionFromFilename(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
}
