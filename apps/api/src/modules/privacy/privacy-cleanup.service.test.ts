import { describe, it, expect } from 'vitest';
import { subtractDays } from './privacy-cleanup.service.js';

describe('subtractDays', () => {
  it('returns a date N days earlier at the same time', () => {
    const now = new Date('2026-08-28T12:00:00.000Z');
    const result = subtractDays(now, 7);
    expect(result.toISOString()).toBe('2026-08-21T12:00:00.000Z');
  });
});
