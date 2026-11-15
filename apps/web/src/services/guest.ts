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
import { normalizeGuestEventToken } from '@/lib/guest-event-token';
import { toPgVector } from '@/lib/bolt/vector-rpc';

function base64ToBlob(base64: string, mime = 'image/jpeg'): Blob {
  const data = base64.includes(',') ? base64.split(',')[1]! : base64;
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type GuestEventPreviewPhoto = {
  id: string;
  url: string;
  label: string;
};

export const guestService = {
  async listEventPreviewPhotos(eventToken: string, limit = 12): Promise<GuestEventPreviewPhoto[]> {
    if (!getBoltEnv().configured) {
      return localDemo.listEventPreviewPhotos(eventToken, limit);
    }

    const supabase = getBoltClient()!;
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .ilike('event_token', normalizeGuestEventToken(eventToken))
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event) return [];

    const { data: rows, error } = await supabase
      .from('photos')
      .select('id, original_name, storage_path')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      logDebug('warn', 'Guest preview photos failed', { error, context: { eventToken } });
      return [];
    }

    return (rows ?? [])
      .map((row) => {
        const url = publicPhotoUrl(row.storage_path);
        if (!url) return null;
        return {
          id: row.id,
          url,
          label: row.original_name?.replace(/\.[^.]+$/, '').slice(0, 28) || 'Event photo',
        };
      })
      .filter((x): x is GuestEventPreviewPhoto => x !== null);
  },

  async getEvent(eventToken: string): Promise<GuestEventPublic> {
    const token = normalizeGuestEventToken(eventToken);
    if (!token) throw new Error('Invalid event link');

    if (!getBoltEnv().configured) {
      const event = localDemo.getPublicEvent(token);
      if (!event) {
        throw new Error(
          'Event not found on this device. The photographer must use a Bolt-hosted site with database connected — this phone cannot see demo-only events.',
        );
      }
      return event;
    }

    const supabase = getBoltClient()!;

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_guest_event', {
      p_event_token: token,
    });

    if (!rpcError && rpcData && typeof rpcData === 'object') {
      const row = rpcData as Record<string, unknown>;
      if (row.name) {
        return {
          name: String(row.name),
          description: (row.description as string) ?? null,
          eventType: (row.event_type as string) ?? null,
          eventDate: (row.event_date as string) ?? null,
          location: (row.location as string) ?? null,
          privacyMode: (row.privacy_mode as GuestEventPublic['privacyMode']) ?? 'PRIVATE_PERSONALIZED',
          downloadEnabled: Boolean(row.download_enabled ?? true),
          guestUploadEnabled: Boolean(row.guest_upload_enabled ?? false),
          status: String(row.status ?? 'ACTIVE') as GuestEventPublic['status'],
          photoCount: Number(row.photo_count ?? 0),
          businessName: String(row.business_name ?? 'Event Studio'),
        };
      }
    }

    if (rpcError) {
      logDebug('warn', 'get_guest_event RPC failed, falling back', { error: rpcError, context: { token } });
    }

    const { data, error } = await supabase
      .from('events')
      .select(
        'name, description, event_type, event_date, location, privacy_mode, download_enabled, guest_upload_enabled, status, photo_count',
      )
      .ilike('event_token', token)
      .maybeSingle();

    if (error) {
      logDebug('error', 'Guest getEvent failed', { error, context: { token } });
      throw new Error(error.message || 'Could not load event. Check database guest permissions (run bolt/schema_hosting_patch.sql).');
    }
    if (!data) {
      throw new Error(
        'No event matches this link. Confirm the URL from your photographer’s dashboard (QR / guest link) and that the event was created on the same hosted site.',
      );
    }

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
      businessName: 'Event Studio',
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
      const result = await localDemo.matchGuest(session.eventToken, embedding);
      localStorage.setItem(`picsharenow:demo:search:${sessionToken}`, JSON.stringify(result));
      return { searchId: result.searchId };
    }

    const { data, error } = await getBoltClient()!.rpc('match_guest_faces', {
      p_event_token: session.eventToken,
      p_query: toPgVector(embedding),
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
