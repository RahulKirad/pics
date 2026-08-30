import { describe, it, expect } from 'vitest';
import { buildPhotoStorageKey, getExtensionFromMime } from './key-builder.js';
import { PhotoVariant } from '@photo-platform/shared-types';

describe('key-builder', () => {
  it('builds tenant-scoped storage keys', () => {
    const key = buildPhotoStorageKey('biz-1', 'evt-1', 'photo-1', 'jpg');
    expect(key).toBe('tenant_biz-1/event_evt-1/originals/photo-1.jpg');
  });

  it('maps mime types to extensions', () => {
    expect(getExtensionFromMime('image/jpeg')).toBe('jpg');
    expect(getExtensionFromMime('image/png')).toBe('png');
    expect(getExtensionFromMime('image/webp')).toBe('webp');
  });
});

describe('PhotoVariant', () => {
  it('has expected variant paths', () => {
    expect(PhotoVariant.ORIGINAL).toBe('originals');
    expect(PhotoVariant.TEMP).toBe('temp');
  });
});
