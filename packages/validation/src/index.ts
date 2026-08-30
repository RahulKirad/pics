import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventType: z.string().max(100).optional(),
  eventDate: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  expiryDate: z.string().datetime().optional(),
  privacyMode: z.enum(['PRIVATE_PERSONALIZED', 'CONTROLLED_GALLERY', 'PUBLIC_GALLERY']).default('PRIVATE_PERSONALIZED'),
  downloadEnabled: z.boolean().default(true),
  guestUploadEnabled: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PROCESSING', 'READY', 'ARCHIVED']).optional(),
});

export const listEventsQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PROCESSING', 'READY', 'ARCHIVED', 'EXPIRED', 'DELETED']).optional(),
  search: z.string().max(200).optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createUploadSessionSchema = z.object({
  eventId: z.string().uuid(),
  originalName: z.string().min(1).max(500),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive(),
  checksum: z.string().min(32).max(128),
  folderId: z.string().uuid().optional(),
});

export const completeUploadSchema = z.object({
  parts: z.array(z.object({
    partNumber: z.number().int().min(1),
    etag: z.string().min(1),
  })).optional(),
});

export const storageSettingsSchema = z.object({
  provider: z.enum(['vps', 's3']),
  endpoint: z.string().optional(),
  bucket: z.string().optional(),
  region: z.string().optional(),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  vpsRootPath: z.string().optional(),
  cdnUrl: z.string().optional(),
  maxFileSizeMb: z.number().int().min(1).max(500).optional(),
  storageQuotaGb: z.number().int().min(1).optional(),
});

export const faceSearchSchema = z.object({
  embedding: z.array(z.number()).min(1),
  threshold: z.number().min(0).max(1).default(0.6),
  limit: z.number().int().min(1).max(100).default(20),
});

export const generateQrCodeSchema = z.object({
  format: z.enum(['png', 'svg', 'both']).default('both'),
  branded: z.boolean().default(false),
});

export const eventTokenParamSchema = z.object({
  eventToken: z.string().min(16).max(128),
});

export const guestSessionTokenParamSchema = z.object({
  sessionToken: z.string().min(16).max(128),
});

export const guestConsentSchema = z.object({
  consentGiven: z.literal(true),
  consentVersion: z.string().min(1).max(20),
});

export const guestSelfieSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

export const guestSearchIdParamSchema = z.object({
  searchId: z.string().uuid(),
});

export const guestPhotoIdParamSchema = z.object({
  photoId: z.string().uuid(),
});

export const guestPhotoFileQuerySchema = z.object({
  variant: z.enum(['thumbnail', 'preview', 'watermarked']).default('preview'),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(14),
});

export const billingCheckoutSchema = z.object({
  planTier: z.enum(['STARTER', 'PROFESSIONAL', 'STUDIO']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const billingVerifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const privacySettingsSchema = z.object({
  guestSessionRetentionDays: z.coerce.number().int().min(1).max(365).default(7),
  guestSelfieRetentionDays: z.coerce.number().int().min(1).max(365).default(30),
  autoExpireEvents: z.boolean().default(true),
});

export const adminListQuerySchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  action: z.string().max(64).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateUploadSessionInput = z.infer<typeof createUploadSessionSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type StorageSettingsInput = z.infer<typeof storageSettingsSchema>;
export type FaceSearchInput = z.infer<typeof faceSearchSchema>;
export type GenerateQrCodeInput = z.infer<typeof generateQrCodeSchema>;
export type GuestConsentInput = z.infer<typeof guestConsentSchema>;
export type GuestSelfieInput = z.infer<typeof guestSelfieSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type BillingCheckoutInput = z.infer<typeof billingCheckoutSchema>;
export type BillingVerifyInput = z.infer<typeof billingVerifySchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
