import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createEventSchema,
  privacySettingsSchema,
  faceSearchSchema,
} from './index.js';

describe('registerSchema', () => {
  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
      businessName: 'Studio One',
    });

    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      firstName: 'Jane',
      lastName: 'Doe',
      businessName: 'Studio One',
    });

    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
  });
});

describe('createEventSchema', () => {
  it('defaults privacy mode and download flags', () => {
    const result = createEventSchema.parse({ name: 'Wedding' });

    expect(result.privacyMode).toBe('PRIVATE_PERSONALIZED');
    expect(result.downloadEnabled).toBe(true);
    expect(result.guestUploadEnabled).toBe(false);
  });
});

describe('privacySettingsSchema', () => {
  it('accepts retention day limits', () => {
    const result = privacySettingsSchema.safeParse({
      guestSessionRetentionDays: 30,
      guestSelfieRetentionDays: 14,
      autoExpireEvents: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects zero retention values', () => {
    const result = privacySettingsSchema.safeParse({
      guestSessionRetentionDays: 0,
      guestSelfieRetentionDays: 14,
      autoExpireEvents: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('faceSearchSchema', () => {
  it('applies default threshold and limit', () => {
    const result = faceSearchSchema.parse({ embedding: [0.1, 0.2, 0.3] });

    expect(result.threshold).toBe(0.6);
    expect(result.limit).toBe(20);
  });
});
