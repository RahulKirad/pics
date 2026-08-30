import { loadEnv } from '@photo-platform/config';
import type { GuestFavoriteToggleResult, GuestShareInfo } from '@photo-platform/shared-types';
import { ForbiddenError, NotFoundError } from '../../common/errors.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { validateStorageKey } from '../../storage/path-security.js';
import { guestRepository } from './guest.repository.js';
import { guestEngagementRepository } from './guest-engagement.repository.js';

function assertSessionActive(expiresAt: Date, now = new Date()): void {
  if (expiresAt <= now) {
    throw new ForbiddenError('Your guest session has expired. Please start again.');
  }
}

function getClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers['x-forwarded-for'];
  return (
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ??
    req.ip ??
    undefined
  );
}

function buildShareUrl(eventToken: string): string {
  const base = loadEnv().PUBLIC_WEB_URL.replace(/\/$/, '');
  return `${base}/e/${eventToken}`;
}

export const guestEngagementService = {
  async listFavoritePhotoIds(sessionToken: string): Promise<string[]> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);
    return guestEngagementRepository.listFavoritePhotoIds(session.id, session.eventId);
  },

  async toggleFavorite(sessionToken: string, photoId: string): Promise<GuestFavoriteToggleResult> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const access = await guestRepository.findGuestSessionPhotoAccess(session.id, photoId);
    if (!access) {
      throw new ForbiddenError('Photo not available in your gallery');
    }

    const isFavorite = await guestEngagementRepository.toggleFavorite(
      session.id,
      session.eventId,
      photoId,
    );
    const favoritePhotoIds = await guestEngagementRepository.listFavoritePhotoIds(
      session.id,
      session.eventId,
    );

    return { photoId, isFavorite, favoritePhotoIds };
  },

  async getShareInfo(sessionToken: string): Promise<GuestShareInfo> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const shareUrl = buildShareUrl(session.event.eventToken);
    return {
      eventName: session.event.name,
      shareUrl,
      shareText: `Check out photos from ${session.event.name}`,
    };
  },

  async resolveDownload(
    sessionToken: string,
    photoId: string,
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<{ key: string; mimeType: string; filename: string }> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    if (!session.event.downloadEnabled) {
      throw new ForbiddenError('Downloads are disabled for this event');
    }

    const access = await guestRepository.findGuestSessionPhotoAccess(session.id, photoId);
    if (!access) {
      throw new ForbiddenError('Photo not available in your gallery');
    }

    const storageKey =
      access.photo.watermarkedKey ?? access.photo.previewKey ?? access.photo.thumbnailKey;
    if (!storageKey) {
      throw new NotFoundError('Download file not available');
    }

    validateStorageKey(storageKey);
    const meta = await getStorageProvider().getMetadata(storageKey);

    await guestEngagementRepository.createDownload({
      photoId,
      guestSessionId: session.id,
      eventId: session.eventId,
      businessId: session.event.businessId,
      ipAddress: getClientIp(req),
    });
    await guestEngagementRepository.incrementEventDownloadCount(session.eventId);

    const extension = meta?.mimeType?.split('/')[1] ?? 'jpg';
    const baseName = access.photo.originalName.replace(/\.[^.]+$/, '');
    const filename = `${baseName || 'photo'}.${extension}`;

    return {
      key: storageKey,
      mimeType: meta?.mimeType ?? 'image/jpeg',
      filename,
    };
  },
};
