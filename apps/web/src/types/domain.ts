/** Client-side domain types (Bolt-hosted PicShareNow). */

export enum UserRole {
  OWNER = 'OWNER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ARCHIVED = 'ARCHIVED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

export enum EventPrivacyMode {
  PRIVATE_PERSONALIZED = 'PRIVATE_PERSONALIZED',
  CONTROLLED_GALLERY = 'CONTROLLED_GALLERY',
  PUBLIC_GALLERY = 'PUBLIC_GALLERY',
}

export enum PhotoStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export const GUEST_CONSENT_VERSION = '1.0';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface AuthBusiness {
  id: string;
  name: string;
  slug: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  business: AuthBusiness;
  businessRole: UserRole;
}

export interface EventSummary {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  eventType: string | null;
  eventDate: string | null;
  expiryDate?: string | null;
  location: string | null;
  status: EventStatus;
  privacyMode: EventPrivacyMode;
  downloadEnabled: boolean;
  guestUploadEnabled: boolean;
  eventToken: string;
  photoCount: number;
  faceCount: number;
  guestSearchCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderSummary {
  id: string;
  eventId: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  photoCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoSummary {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: PhotoStatus;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  processingError: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface QrCodeSummary {
  id: string;
  eventId: string;
  label: string;
  scanCount: number;
  createdAt: string;
  imageUrl: string | null;
  hasSvg?: boolean;
  previewUrl?: string | null;
}

export interface GuestEventPublic {
  name: string;
  description: string | null;
  eventType: string | null;
  eventDate: string | null;
  location: string | null;
  privacyMode: EventPrivacyMode;
  downloadEnabled: boolean;
  guestUploadEnabled: boolean;
  status: EventStatus;
  photoCount: number;
  businessName: string;
}

export interface GuestSessionSummary {
  sessionToken: string;
  eventToken: string;
  consentGiven: boolean;
  consentVersion: string | null;
  createdAt: string;
  expiresAt?: string;
  hasConsent?: boolean;
}

export interface GuestConsentResult {
  consentGiven: boolean;
  consentVersion: string;
}

export interface GuestSelfieValidationResult {
  passed: boolean;
  reason: string | null;
}

export interface GuestSelfieSubmissionResult {
  searchId: string;
}

export interface GuestMatchedPhoto {
  photoId: string;
  thumbnailUrl: string;
  previewUrl: string;
  viewerUrl?: string;
  matchScore: number;
  similarity?: number;
  originalName: string;
  width?: number | null;
  height?: number | null;
  isFavorite?: boolean;
}

export type GuestSearchStatus = {
  searchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  matchCount: number;
  error: string | null;
};

export interface GuestSearchResult extends GuestSearchStatus {
  matches: GuestMatchedPhoto[];
  favoritePhotoIds: string[];
  downloadEnabled: boolean;
  shareUrl: string;
  eventName: string;
  errorMessage?: string | null;
}

export interface GuestFavoriteToggleResult {
  photoId: string;
  isFavorite: boolean;
  favoritePhotoIds: string[];
}

export interface DailyMetric {
  date: string;
  uploads: number;
  guestSearches: number;
  downloads: number;
  count?: number;
}

export interface EventAnalytics {
  eventId: string;
  totals: {
    photos: number;
    faces: number;
    guestSearches: number;
    downloads: number;
  };
  daily: DailyMetric[];
  guestSessionCount?: number;
  averageMatchCount?: number;
  favoriteCount?: number;
  guestSearchesByDay?: DailyMetric[];
  downloadsByDay?: DailyMetric[];
  recentSearches?: {
    id: string;
    createdAt: string;
    matchCount: number;
    processingMs?: number;
    status?: string;
  }[];
}
