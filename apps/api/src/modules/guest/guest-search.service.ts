import { loadEnv } from '@photo-platform/config';
import type { GuestSearchResult, GuestSearchStatus } from '@photo-platform/shared-types';
import { ForbiddenError, NotFoundError } from '../../common/errors.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { validateStorageKey } from '../../storage/path-security.js';
import { guestRepository } from './guest.repository.js';
import { guestEngagementRepository } from './guest-engagement.repository.js';

type PhotoVariant = 'thumbnail' | 'preview' | 'watermarked';

function assertSessionActive(expiresAt: Date, now = new Date()): void {
  if (expiresAt <= now) {
    throw new ForbiddenError('Your guest session has expired. Please start again.');
  }
}

function serializeSearchStatus(search: {
  id: string;
  matchCount: number;
  processingMs: number | null;
  errorMessage: string | null;
  createdAt: Date;
}): GuestSearchStatus {
  let status: GuestSearchStatus['status'] = 'pending';
  if (search.errorMessage) {
    status = 'failed';
  } else if (search.processingMs !== null) {
    status = 'complete';
  }

  return {
    id: search.id,
    status,
    matchCount: search.matchCount,
    processingMs: search.processingMs,
    errorMessage: search.errorMessage,
    createdAt: search.createdAt.toISOString(),
  };
}

function buildGuestPhotoUrl(sessionToken: string, photoId: string, variant: PhotoVariant): string {
  return `/api/v1/guest/sessions/${sessionToken}/photos/${photoId}/file?variant=${variant}`;
}

function buildShareUrl(eventToken: string): string {
  const base = loadEnv().PUBLIC_WEB_URL.replace(/\/$/, '');
  return `${base}/e/${eventToken}`;
}

async function buildGalleryContext(session: {
  id: string;
  eventId: string;
  event: { name: string; eventToken: string; downloadEnabled: boolean };
}) {
  const favoritePhotoIds = await guestEngagementRepository.listFavoritePhotoIds(
    session.id,
    session.eventId,
  );

  return {
    favoritePhotoIds,
    downloadEnabled: session.event.downloadEnabled,
    shareUrl: buildShareUrl(session.event.eventToken),
    eventName: session.event.name,
  };
}

export const guestSearchService = {
  async getSearchResult(sessionToken: string, searchId: string): Promise<GuestSearchResult> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const search = await guestRepository.findGuestSearchWithMatches(searchId, session.id);
    if (!search) {
      throw new NotFoundError('Search not found');
    }

    const status = serializeSearchStatus(search);
    const galleryContext = await buildGalleryContext(session);

    if (status.status !== 'complete') {
      return { ...status, matches: [], ...galleryContext };
    }

    const favoriteSet = new Set(galleryContext.favoritePhotoIds);

    return {
      ...status,
      ...galleryContext,
      matches: search.matches.map((match) => {
        const thumbnailUrl = match.photo.thumbnailKey
          ? buildGuestPhotoUrl(sessionToken, match.photoId, 'thumbnail')
          : null;
        const previewUrl = match.photo.previewKey
          ? buildGuestPhotoUrl(sessionToken, match.photoId, 'preview')
          : null;
        const watermarkedUrl = match.photo.watermarkedKey
          ? buildGuestPhotoUrl(sessionToken, match.photoId, 'watermarked')
          : null;

        return {
          photoId: match.photoId,
          similarity: match.similarity,
          rank: match.rank,
          thumbnailUrl,
          previewUrl: previewUrl ?? watermarkedUrl,
          viewerUrl: watermarkedUrl ?? previewUrl ?? thumbnailUrl,
          width: match.photo.width,
          height: match.photo.height,
          isFavorite: favoriteSet.has(match.photoId),
        };
      }),
    };
  },

  async resolveGuestPhotoKey(
    sessionToken: string,
    photoId: string,
    variant: PhotoVariant,
  ): Promise<{ key: string; mimeType: string }> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);

    const access = await guestRepository.findGuestSessionPhotoAccess(session.id, photoId);
    if (!access) {
      throw new ForbiddenError('Photo not available in your gallery');
    }

    const keyMap: Record<PhotoVariant, string | null | undefined> = {
      thumbnail: access.photo.thumbnailKey,
      preview: access.photo.previewKey,
      watermarked: access.photo.watermarkedKey,
    };

    const storageKey = keyMap[variant] ?? access.photo.previewKey ?? access.photo.watermarkedKey;
    if (!storageKey) {
      throw new NotFoundError('Photo file not available');
    }

    validateStorageKey(storageKey);
    const meta = await getStorageProvider().getMetadata(storageKey);
    return {
      key: storageKey,
      mimeType: meta?.mimeType ?? 'image/jpeg',
    };
  },
};
