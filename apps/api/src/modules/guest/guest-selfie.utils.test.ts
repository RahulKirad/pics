import { describe, it, expect } from 'vitest';
import type { DetectedFace } from '@photo-platform/shared-types';
import { decodeBase64Image, pickPrimaryFace } from './guest-selfie.utils.js';

describe('decodeBase64Image', () => {
  it('decodes raw base64 payloads', () => {
    const buffer = decodeBase64Image(Buffer.from('hello').toString('base64'));
    expect(buffer.toString()).toBe('hello');
  });

  it('decodes data URLs', () => {
    const buffer = decodeBase64Image(`data:image/jpeg;base64,${Buffer.from('jpeg').toString('base64')}`);
    expect(buffer.toString()).toBe('jpeg');
  });
});

describe('pickPrimaryFace', () => {
  const faces: DetectedFace[] = [
    {
      boundingBox: { x: 0, y: 0, width: 50, height: 50 },
      confidence: 0.9,
    },
    {
      boundingBox: { x: 10, y: 10, width: 120, height: 140 },
      confidence: 0.95,
    },
  ];

  it('returns null when no faces are detected', () => {
    expect(pickPrimaryFace([])).toBeNull();
  });

  it('returns the largest face by bounding box area', () => {
    const primary = pickPrimaryFace(faces);
    expect(primary?.boundingBox.width).toBe(120);
  });
});
