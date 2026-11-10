import { z } from 'zod';

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

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventType: z.string().max(100).optional(),
  eventDate: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  expiryDate: z.string().datetime().optional(),
  privacyMode: z
    .enum(['PRIVATE_PERSONALIZED', 'CONTROLLED_GALLERY', 'PUBLIC_GALLERY'])
    .default('PRIVATE_PERSONALIZED'),
  downloadEnabled: z.boolean().default(true),
  guestUploadEnabled: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'READY', 'ARCHIVED']).optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
