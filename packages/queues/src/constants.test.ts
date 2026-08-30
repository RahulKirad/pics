import { describe, it, expect } from 'vitest';
import { QUEUE_NAMES, QUEUE_DEFINITIONS, DEFAULT_JOB_OPTIONS } from './constants.js';

describe('queue constants', () => {
  it('defines all queue names with metadata', () => {
    expect(QUEUE_NAMES.length).toBe(13);
    for (const name of QUEUE_NAMES) {
      expect(QUEUE_DEFINITIONS[name]).toBeDefined();
      expect(QUEUE_DEFINITIONS[name].description.length).toBeGreaterThan(0);
    }
  });

  it('uses exponential backoff with retries', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBeGreaterThan(1);
    expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential');
  });

  it('marks image-processing as implemented', () => {
    expect(QUEUE_DEFINITIONS['image-processing'].implemented).toBe(true);
    expect(QUEUE_DEFINITIONS['face-detection'].implemented).toBe(true);
    expect(QUEUE_DEFINITIONS['face-embedding'].implemented).toBe(true);
    expect(QUEUE_DEFINITIONS['vector-indexing'].implemented).toBe(true);
  });
});
