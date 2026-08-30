export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  UPLOADER = 'UPLOADER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
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

export enum StorageDriver {
  VPS = 'vps',
  S3 = 's3',
}

export enum PhotoVariant {
  ORIGINAL = 'originals',
  PREVIEW = 'previews',
  THUMBNAIL = 'thumbnails',
  WATERMARKED = 'watermarked',
  GUEST_UPLOAD = 'guest_uploads',
  AI = 'ai',
  TEMP = 'temp',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  EXPIRED = 'EXPIRED',
}

export enum PlanTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  STUDIO = 'STUDIO',
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthContext {
  userId: string;
  businessId: string;
  role: UserRole;
}

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
  business: AuthBusiness | null;
  businessRole: UserRole | null;
}

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  eventToken: string;
  description: string | null;
  eventType: string | null;
  eventDate: string | null;
  location: string | null;
  expiryDate: string | null;
  privacyMode: EventPrivacyMode;
  downloadEnabled: boolean;
  guestUploadEnabled: boolean;
  status: EventStatus;
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

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  boundingBox: BoundingBox;
  confidence: number;
  qualityScore?: number;
  landmarks?: Record<string, number>;
}

export interface FaceEmbeddingResult {
  embedding: number[];
  modelVersion: string;
  dimensions: number;
}

export interface FaceMatchCandidate {
  id: string;
  embedding: number[];
}

export interface FaceMatchResult {
  id: string;
  similarity: number;
}

export interface FaceQualityResult {
  passed: boolean;
  score: number;
  reason?: string | null;
  metrics?: Record<string, number>;
}

export interface FaceDetectionResult {
  faces: DetectedFace[];
  count: number;
  modelVersion: string;
}

export interface FaceSearchMatch {
  photoFaceId: string;
  photoId: string;
  score: number;
}

export interface FaceSearchResult {
  matches: FaceSearchMatch[];
  threshold: number;
  count: number;
}

export interface QrCodeSummary {
  id: string;
  eventId: string;
  format: string;
  isBranded: boolean;
  guestUrl: string;
  hasPng: boolean;
  hasSvg: boolean;
  previewUrl: string;
  downloadPngUrl: string | null;
  downloadSvgUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QrCodeListResult {
  guestUrl: string;
  items: QrCodeSummary[];
}

export const GUEST_CONSENT_VERSION = '1.0';

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
  expiresAt: string;
  hasConsent: boolean;
  consentVersion: string | null;
}

export interface GuestConsentResult {
  consentVersion: string;
  consentTimestamp: string;
}

export interface GuestSelfieValidationResult {
  passed: boolean;
  score: number;
  reason: string | null;
  faceCount: number;
  metrics?: Record<string, number>;
  boundingBox?: BoundingBox | null;
}

export interface GuestSelfieSubmissionResult {
  searchId: string;
  status: 'pending';
}

export interface GuestSearchStatus {
  id: string;
  status: 'pending' | 'complete' | 'failed';
  matchCount: number;
  processingMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface GuestMatchedPhoto {
  photoId: string;
  similarity: number;
  rank: number;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  viewerUrl: string | null;
  width: number | null;
  height: number | null;
  isFavorite: boolean;
}

export interface GuestSearchResult extends GuestSearchStatus {
  matches: GuestMatchedPhoto[];
  favoritePhotoIds: string[];
  downloadEnabled: boolean;
  shareUrl: string;
  eventName: string;
}

export interface GuestFavoriteToggleResult {
  photoId: string;
  isFavorite: boolean;
  favoritePhotoIds: string[];
}

export interface GuestShareInfo {
  eventName: string;
  shareUrl: string;
  shareText: string;
}

export interface PaginationMeta {
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface DailyMetric {
  date: string;
  count: number;
}

export interface BusinessAnalyticsOverview {
  totalEvents: number;
  activeEvents: number;
  byStatus: Record<string, number>;
  totalPhotos: number;
  totalFaces: number;
  totalGuestSearches: number;
  totalDownloads: number;
  totalGuestSessions: number;
  totalFavorites: number;
  storageBytes: number;
  guestSearchesByDay: DailyMetric[];
  downloadsByDay: DailyMetric[];
}

export interface EventAnalyticsRecentSearch {
  id: string;
  matchCount: number;
  processingMs: number | null;
  status: 'pending' | 'complete' | 'failed';
  createdAt: string;
}

export interface EventAnalytics {
  eventId: string;
  photoCount: number;
  faceCount: number;
  guestSearchCount: number;
  downloadCount: number;
  guestSessionCount: number;
  favoriteCount: number;
  averageMatchCount: number;
  guestSearchesByDay: DailyMetric[];
  downloadsByDay: DailyMetric[];
  recentSearches: EventAnalyticsRecentSearch[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Record<string, { status: string; latencyMs?: number; message?: string }>;
}

export type QueueJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

export interface QueueStats {
  name: string;
  description: string;
  implemented: boolean;
  concurrency: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueJobSummary {
  id: string;
  name: string;
  queue: string;
  state: QueueJobState;
  attemptsMade: number;
  maxAttempts: number;
  failedReason: string | null;
  timestamp: string;
  processedOn: string | null;
  finishedOn: string | null;
  data: Record<string, unknown>;
}

export interface QueueOverview {
  redisConnected: boolean;
  queues: QueueStats[];
  totals: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export interface PlanLimits {
  maxEvents: number;
  maxStorageGb: number;
  maxPhotos: number;
  maxAiProcessing: number;
  maxFaceSearches: number;
  maxBandwidthGb: number;
  maxDownloads: number;
  maxTeamMembers: number;
  brandingEnabled: boolean;
}

export interface PlanSummary extends PlanLimits {
  id: string;
  tier: PlanTier;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
}

export interface QuotaMetric {
  used: number;
  limit: number;
}

export interface QuotaUsage {
  events: QuotaMetric;
  photos: QuotaMetric;
  storageBytes: QuotaMetric;
  faceSearches: QuotaMetric;
  downloads: QuotaMetric;
  teamMembers: QuotaMetric;
}

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  plan: PlanSummary;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

export interface BillingOverview {
  subscription: SubscriptionSummary | null;
  usage: QuotaUsage;
  razorpayConfigured: boolean;
  razorpayKeyId: string | null;
}

export interface CheckoutOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  planTier: PlanTier;
  billingCycle: 'monthly' | 'yearly';
  paymentId: string;
}

export interface PaymentVerifyInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerifyResult {
  subscription: SubscriptionSummary;
  invoiceNumber: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuedAt: string;
  paidAt: string | null;
  planName: string;
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
  business: { id: string; name: string } | null;
}

export interface AdminPlatformOverview {
  totalBusinesses: number;
  totalUsers: number;
  activeEvents: number;
  totalPhotos: number;
  totalStorageBytes: number;
  guestSearches24h: number;
  activeSubscriptions: number;
  totalRevenue: number;
  aiJobs24h: number;
  systemStatus: HealthCheckResult['status'];
  services: HealthCheckResult['services'];
  recentActivity: AdminAuditLogEntry[];
}

export interface AdminBusinessRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount: number;
  eventCount: number;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  businessCount: number;
  createdAt: string;
}

export interface AdminEventRow {
  id: string;
  name: string;
  status: EventStatus;
  businessId: string;
  businessName: string;
  photoCount: number;
  guestSearchCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface AdminPhotoRow {
  id: string;
  originalName: string;
  status: PhotoStatus;
  fileSize: number;
  businessId: string;
  businessName: string;
  eventId: string;
  eventName: string;
  createdAt: string;
}

export interface AdminSubscriptionRow {
  id: string;
  businessId: string;
  businessName: string;
  planName: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface AdminPaymentRow {
  id: string;
  businessId: string;
  businessName: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  razorpayPayId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
}

export interface AdminStorageUsageRow {
  business: { id: string; name: string; slug: string };
  originalBytes: number;
  previewBytes: number;
  thumbnailBytes: number;
  watermarkBytes: number;
  guestUploadBytes: number;
  tempBytes: number;
  aiBytes: number;
  totalBytes: number;
  lastCalculatedAt: string | null;
  storageDriver: string | null;
}

export interface PrivacySettings {
  guestSessionRetentionDays: number;
  guestSelfieRetentionDays: number;
  autoExpireEvents: boolean;
}

export interface CleanupRunResult {
  expiredEvents: number;
  deletedSessions: number;
  deletedSelfies: number;
  purgedSearches: number;
}

export interface SecurityAuditFinding {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  passed: boolean;
}

export interface SecurityAuditReport {
  generatedAt: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  findings: SecurityAuditFinding[];
}

export interface GuestDataDeletionResult {
  deleted: boolean;
  sessionsRemoved: number;
  selfiesRemoved: number;
}
