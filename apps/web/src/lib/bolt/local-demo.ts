/**
 * Offline demo when Bolt Database env vars are missing (local Vite dev).
 * On Bolt Hosting, set VITE_BOLT_DATABASE_URL + VITE_BOLT_DATABASE_ANON_KEY.
 */

import type {
  AuthSession,
  EventSummary,
  GuestEventPublic,
  GuestSearchResult,
  GuestSessionSummary,
  PhotoSummary,
} from '@/types/domain';
import { EventPrivacyMode, EventStatus, PhotoStatus, UserRole } from '@/types/domain';
import type { FaceEmbedding } from '@/lib/face/browser-face';
import { cosineSimilarity } from '@/lib/face/browser-face';
import type { LoginInput, RegisterInput } from '@/lib/schemas';
import {
  deleteDemoPhotoBlob,
  primeDemoPhotoPreview,
  resolveDemoPhotoPreviewUrl,
} from '@/lib/bolt/demo-blobs';
import { deleteFaceRecordsForPhoto } from '@/lib/face/face-index';

const USERS_KEY = 'picsharenow:demo:users';
const EVENTS_KEY = 'picsharenow:demo:events';
const PHOTOS_KEY = 'picsharenow:demo:photos';
const EMBEDDINGS_KEY = 'picsharenow:demo:embeddings';
const GUEST_KEY = 'picsharenow:demo:guest';
const SESSION_KEY = 'picsharenow:demo:active-session';

type DemoUser = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
};

type DemoPhoto = PhotoSummary & { eventId: string; storagePath: string; ownerId: string };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return crypto.randomUUID();
}

function token() {
  return crypto.randomUUID().replace(/-/g, '');
}

export const localDemo = {
  register(input: RegisterInput): AuthSession {
    const users = load<DemoUser[]>(USERS_KEY, []);
    if (users.some((u) => u.email === input.email)) {
      throw new Error('Email already registered');
    }
    const user: DemoUser = {
      id: uid(),
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      businessName: input.businessName,
    };
    users.push(user);
    save(USERS_KEY, users);
    const session = this.login({ email: input.email, password: input.password });
    save(SESSION_KEY, session);
    return session;
  },

  login(input: LoginInput): AuthSession {
    const users = load<DemoUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.email === input.email && u.password === input.password);
    if (!user) throw new Error('Invalid email or password');
    const session = {
      accessToken: `demo-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: UserRole.OWNER,
        emailVerified: true,
      },
      business: {
        id: user.id,
        name: user.businessName,
        slug: user.businessName.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
      },
      businessRole: UserRole.OWNER,
    };
    save(SESSION_KEY, session);
    return session;
  },

  loadSession(): AuthSession | null {
    return load<AuthSession | null>(SESSION_KEY, null);
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  listEvents(ownerId: string): { items: EventSummary[]; hasMore: false; nextCursor: null } {
    const events = load<EventSummary[]>(EVENTS_KEY, []).filter((e) => e.businessId === ownerId);
    return { items: events, hasMore: false, nextCursor: null };
  },

  createEvent(ownerId: string, _businessName: string, name: string): EventSummary {
    const events = load<EventSummary[]>(EVENTS_KEY, []);
    const now = new Date().toISOString();
    const event: EventSummary = {
      id: uid(),
      businessId: ownerId,
      name,
      description: null,
      eventType: null,
      eventDate: null,
      location: null,
      status: EventStatus.ACTIVE,
      privacyMode: EventPrivacyMode.PRIVATE_PERSONALIZED,
      downloadEnabled: true,
      guestUploadEnabled: false,
      eventToken: token().slice(0, 12),
      photoCount: 0,
      faceCount: 0,
      guestSearchCount: 0,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    events.push(event);
    save(EVENTS_KEY, events);
    return event;
  },

  getEventById(id: string) {
    return load<EventSummary[]>(EVENTS_KEY, []).find((e) => e.id === id) ?? null;
  },

  getPublicEvent(eventToken: string): GuestEventPublic | null {
    const event = load<EventSummary[]>(EVENTS_KEY, []).find((e) => e.eventToken === eventToken);
    if (!event) return null;
    return {
      name: event.name,
      description: event.description,
      eventType: event.eventType,
      eventDate: event.eventDate,
      location: event.location,
      privacyMode: event.privacyMode,
      downloadEnabled: event.downloadEnabled,
      guestUploadEnabled: event.guestUploadEnabled,
      status: event.status,
      photoCount: event.photoCount,
      businessName: 'Demo Studio',
    };
  },

  syncFaceCount(eventId: string, faceCount: number) {
    const events = load<EventSummary[]>(EVENTS_KEY, []);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx]!.faceCount = faceCount;
      save(EVENTS_KEY, events);
    }
  },

  async listPhotos(eventId: string) {
    const photos = load<DemoPhoto[]>(PHOTOS_KEY, []).filter((p) => p.eventId === eventId);
    const items = await Promise.all(
      photos.map(async (p) => {
        const url = await resolveDemoPhotoPreviewUrl(p.id);
        return { ...p, thumbnailUrl: url, previewUrl: url };
      }),
    );
    return { items, hasMore: false, nextCursor: null };
  },

  async addPhoto(
    ownerId: string,
    eventId: string,
    file: File,
    embeddings: FaceEmbedding[],
  ): Promise<PhotoSummary> {
    const photos = load<DemoPhoto[]>(PHOTOS_KEY, []);
    const id = uid();
    const previewUrl = await primeDemoPhotoPreview(id, file);
    const photo: DemoPhoto = {
      id,
      eventId,
      ownerId,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      status: PhotoStatus.READY,
      width: null,
      height: null,
      thumbnailUrl: null,
      previewUrl: null,
      processingError:
        embeddings.length === 0 ? 'Photo saved. No faces indexed — guest matching may skip it.' : null,
      createdAt: new Date().toISOString(),
      storagePath: `${eventId}/${id}.jpg`,
    };
    photos.push(photo);
    save(PHOTOS_KEY, photos);

    const store = load<Record<string, FaceEmbedding[]>>(EMBEDDINGS_KEY, {});
    store[id] = embeddings;
    save(EMBEDDINGS_KEY, store);

    const events = load<EventSummary[]>(EVENTS_KEY, []);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx]!.photoCount += 1;
      events[idx]!.faceCount += embeddings.length;
      save(EVENTS_KEY, events);
    }
    return { ...photo, thumbnailUrl: previewUrl, previewUrl };
  },

  async deletePhoto(photoId: string, eventId: string): Promise<void> {
    const photos = load<DemoPhoto[]>(PHOTOS_KEY, []);
    const idx = photos.findIndex((p) => p.id === photoId && p.eventId === eventId);
    if (idx < 0) throw new Error('Photo not found');

    const embeddings = load<Record<string, FaceEmbedding[]>>(EMBEDDINGS_KEY, {});
    const faceCount = embeddings[photoId]?.length ?? 0;
    delete embeddings[photoId];
    save(EMBEDDINGS_KEY, embeddings);

    photos.splice(idx, 1);
    save(PHOTOS_KEY, photos);
    await deleteDemoPhotoBlob(photoId);
    await deleteFaceRecordsForPhoto(photoId);

    const events = load<EventSummary[]>(EVENTS_KEY, []);
    const eventIdx = events.findIndex((e) => e.id === eventId);
    if (eventIdx >= 0) {
      events[eventIdx]!.photoCount = Math.max(0, events[eventIdx]!.photoCount - 1);
      events[eventIdx]!.faceCount = Math.max(0, events[eventIdx]!.faceCount - faceCount);
      save(EVENTS_KEY, events);
    }
  },

  createGuestSession(eventToken: string): GuestSessionSummary {
    const sessions = load<GuestSessionSummary[]>(GUEST_KEY, []);
    const session: GuestSessionSummary = {
      sessionToken: token(),
      eventToken,
      consentGiven: false,
      consentVersion: null,
      createdAt: new Date().toISOString(),
    };
    sessions.push(session);
    save(GUEST_KEY, sessions);
    return session;
  },

  getGuestSession(sessionToken: string) {
    return load<GuestSessionSummary[]>(GUEST_KEY, []).find((s) => s.sessionToken === sessionToken) ?? null;
  },

  recordConsent(sessionToken: string) {
    const sessions = load<GuestSessionSummary[]>(GUEST_KEY, []);
    const s = sessions.find((x) => x.sessionToken === sessionToken);
    if (!s) throw new Error('Session not found');
    s.consentGiven = true;
    s.consentVersion = '1.0';
    save(GUEST_KEY, sessions);
    return { consentGiven: true, consentVersion: '1.0' };
  },

  async matchGuest(eventToken: string, query: FaceEmbedding): Promise<GuestSearchResult> {
    const event = load<EventSummary[]>(EVENTS_KEY, []).find((e) => e.eventToken === eventToken);
    if (!event) throw new Error('Event not found');
    const photos = load<DemoPhoto[]>(PHOTOS_KEY, []).filter((p) => p.eventId === event.id);
    const embeddings = load<Record<string, FaceEmbedding[]>>(EMBEDDINGS_KEY, {});

    const ranked = photos
      .map((photo) => {
        const faces = embeddings[photo.id] ?? [];
        const best = faces.reduce((max, emb) => Math.max(max, cosineSimilarity(query, emb)), 0);
        return { photo, best };
      })
      .filter((m) => m.best >= 0.55)
      .sort((a, b) => b.best - a.best);

    const matches = await Promise.all(
      ranked.map(async (m) => {
        const url = (await resolveDemoPhotoPreviewUrl(m.photo.id)) ?? '';
        return {
          photoId: m.photo.id,
          thumbnailUrl: url,
          previewUrl: url,
          viewerUrl: url,
          matchScore: m.best,
          similarity: m.best,
          originalName: m.photo.originalName,
        };
      }),
    );

    return {
      searchId: uid(),
      status: 'completed',
      progress: 100,
      matchCount: matches.length,
      error: null,
      matches,
      favoritePhotoIds: [],
      downloadEnabled: event.downloadEnabled,
      shareUrl: `${window.location.origin}/e/${eventToken}`,
      eventName: event.name,
    };
  },
};
