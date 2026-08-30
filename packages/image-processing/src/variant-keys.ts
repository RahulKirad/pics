import { PhotoVariant } from '@photo-platform/shared-types';

export function buildVariantKey(
  businessId: string,
  eventId: string,
  variant: PhotoVariant,
  photoId: string,
  extension = 'jpg',
): string {
  const ext = extension.replace(/^\./, '').toLowerCase();
  return `tenant_${businessId}/event_${eventId}/${variant}/${photoId}.${ext}`;
}
