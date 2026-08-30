import type { GuestMatchedPhoto } from '@photo-platform/shared-types';

export async function downloadGuestPhoto(
  sessionToken: string,
  photo: GuestMatchedPhoto,
): Promise<void> {
  const response = await fetch(
    `/api/v1/guest/sessions/${sessionToken}/photos/${photo.photoId}/download`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? 'Download failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `photo-${photo.photoId.slice(0, 8)}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function shareGuestGallery(
  eventName: string,
  shareUrl: string,
  shareText: string,
): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({
      title: eventName,
      text: shareText,
      url: shareUrl,
    });
    return 'shared';
  }

  await navigator.clipboard.writeText(shareUrl);
  return 'copied';
}
