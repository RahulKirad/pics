import type {
  GuestConsentResult,
  GuestEventPublic,
  GuestFavoriteToggleResult,
  GuestSearchResult,
  GuestSelfieSubmissionResult,
  GuestSelfieValidationResult,
  GuestSessionSummary,
} from '@/types/domain';
import { GUEST_CONSENT_VERSION } from '@/types/domain';
import { getBoltClient, publicPhotoUrl } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { localDemo } from '@/lib/bolt/local-demo';
import { extractPrimaryFaceEmbedding, validateSelfieBlob } from '@/lib/face/browser-face';
import { logDebug } from '@/lib/bolt/debug-log';

function base64ToBlob(base64: string, mime = 'image/jpeg'): Blob {
  const data = base64.includes(',') ? base64.split(',')[1]! : base64;
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export const guestService = {
  async getEvent(eventToken: string): Promise<GuestEventPublic> {
    if (!getBoltEnv().configured) {
      const event = localDemo.getPublicEvent(eventToken);
      if (!event) throw new Error('Event not found');
      return event;
    }
    const { data, error } = await getBoltClient()!
      .from('events')
      .select('name, description, event_type, event_date, location, privacy_mode, download_enabled, guest_upload_enabled, status, photo_count, profiles(business_name)')
      .eq('event_token', eventToken)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Event not found');
    const profile = data.profiles as { business_name?: string } | null;
    return {
      name: data.name,
      description: data.description,
      eventType: data.event_type,
      eventDate: data.event_date,
      location: data.location,
      privacyMode: data.privacy_mode,
      downloadEnabled: data.download_enabled,
      guestUploadEnabled: data.guest_upload_enabled,
      status: data.status,
      photoCount: data.photo_count ?? 0,
      businessName: profile?.business_name ?? 'Event Studio',
    };
  },

  async createSession(eventToken: string): Promise<GuestSessionSummary> {
    if (!getBoltEnv().configured) return localDemo.createGuestSession(eventToken);
    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const { error } = await getBoltClient()!.from('guest_sessions').insert({
      session_token: sessionToken,
      event_token: eventToken,
    });
    if (error) throw error;
    return {
      sessionToken,
      eventToken,
      consentGiven: false,
      consentVersion: null,
      createdAt: new Date().toISOString(),
    };
  },

  async getSession(sessionToken: string): Promise<GuestSessionSummary> {
    if (!getBoltEnv().configured) {
      const s = localDemo.getGuestSession(sessionToken);
      if (!s) throw new Error('Session expired');
      return s;
    }
    const { data, error } = await getBoltClient()!
      .from('guest_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Session expired');
    return {
      sessionToken: data.session_token,
      eventToken: data.event_token,
      consentGiven: data.consent_given,
      consentVersion: data.consent_version,
      createdAt: data.created_at,
    };
  },

  async recordConsent(sessionToken: string): Promise<GuestConsentResult> {
    if (!getBoltEnv().configured) return localDemo.recordConsent(sessionToken);
    const { error } = await getBoltClient()!
      .from('guest_sessions')
      .update({ consent_given: true, consent_version: GUEST_CONSENT_VERSION })
      .eq('session_token', sessionToken);
    if (error) throw error;
    return { consentGiven: true, consentVersion: GUEST_CONSENT_VERSION };
  },

  async validateSelfie(
    _sessionToken: string,
    payload: { imageBase64: string; mimeType?: string },
  ): Promise<GuestSelfieValidationResult> {
    const blob = base64ToBlob(payload.imageBase64, payload.mimeType);
    return validateSelfieBlob(blob);
  },

  async submitSelfie(
    sessionToken: string,
    payload: { imageBase64: string; mimeType?: string },
  ): Promise<GuestSelfieSubmissionResult> {
    const session = await this.getSession(sessionToken);
    const blob = base64ToBlob(payload.imageBase64, payload.mimeType);
    const embedding = await extractPrimaryFaceEmbedding(blob);

    if (!getBoltEnv().configured) {
      const result = localDemo.matchGuest(session.eventToken, embedding);
      localStorage.setItem(`picsharenow:demo:search:${sessionToken}`, JSON.stringify(result));
      return { searchId: result.searchId };
    }

    const { data, error } = await getBoltClient()!.rpc('match_guest_faces', {
      p_event_token: session.eventToken,
      p_query: embedding,
    });
    if (error) {
      logDebug('error', 'match_guest_faces failed', { error, context: { event: session.eventToken } });
      throw error;
    }

    const searchId = crypto.randomUUID();
    localStorage.setItem(
      `picsharenow:guest-search:${searchId}`,
      JSON.stringify({ sessionToken, matches: data }),
    );
    return { searchId };
  },

  async getSearchResult(sessionToken: string, searchId: string): Promise<GuestSearchResult> {
    if (!getBoltEnv().configured) {
      const raw = localStorage.getItem(`picsharenow:demo:search:${sessionToken}`);
      if (!raw) throw new Error('Search not found');
      return JSON.parse(raw) as GuestSearchResult;
    }

    const session = await this.getSession(sessionToken);
    const raw = localStorage.getItem(`picsharenow:guest-search:${searchId}`);
    const cached = raw ? (JSON.parse(raw) as { matches: { photo_id: string; match_score: number }[] }) : null;
    const event = await this.getEvent(session.eventToken);

    const photoIds = (cached?.matches ?? []).map((m) => m.photo_id);
    const { data: photoRows } = await getBoltClient()!
      .from('photos')
      .select('id, original_name, storage_path')
      .in('id', photoIds);

    const matches = (cached?.matches ?? []).map((m) => {
      const row = photoRows?.find((p) => p.id === m.photo_id);
      const url = row ? publicPhotoUrl(row.storage_path) : null;
      return {
        photoId: m.photo_id,
        thumbnailUrl: url ?? '',
        previewUrl: url ?? '',
        viewerUrl: url ?? '',
        matchScore: m.match_score,
        similarity: m.match_score,
        originalName: row?.original_name ?? 'Matched photo',
      };
    });

    return {
      searchId,
      status: 'completed',
      progress: 100,
      matchCount: matches.length,
      error: null,
      matches,
      favoritePhotoIds: [],
      downloadEnabled: event.downloadEnabled,
      shareUrl: `${window.location.origin}/e/${session.eventToken}`,
      eventName: event.name,
    };
  },

  async toggleFavorite(sessionToken: string, photoId: string): Promise<GuestFavoriteToggleResult> {
    const key = `picsharenow:favorites:${sessionToken}`;
    const current = new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as string[]);
    if (current.has(photoId)) current.delete(photoId);
    else current.add(photoId);
    const favoritePhotoIds = [...current];
    localStorage.setItem(key, JSON.stringify(favoritePhotoIds));
    return { photoId, isFavorite: favoritePhotoIds.includes(photoId), favoritePhotoIds };
  },

  async deleteMyData(sessionToken: string) {
    if (getBoltEnv().configured) {
      await getBoltClient()!.from('guest_sessions').delete().eq('session_token', sessionToken);
    }
    localStorage.removeItem(`picsharenow:favorites:${sessionToken}`);
    return { deleted: true, sessionsRemoved: 1, selfiesRemoved: 1 };
  },
};
