import { describe, it, expect } from 'vitest';
import {
  buildDailySeries,
  deriveSearchStatus,
  startOfDayDaysAgo,
} from './analytics.utils.js';

describe('deriveSearchStatus', () => {
  it('returns failed when an error message exists', () => {
    expect(deriveSearchStatus({ processingMs: null, errorMessage: 'timeout' })).toBe('failed');
  });

  it('returns complete when processing finished', () => {
    expect(deriveSearchStatus({ processingMs: 120, errorMessage: null })).toBe('complete');
  });

  it('returns pending while processing', () => {
    expect(deriveSearchStatus({ processingMs: null, errorMessage: null })).toBe('pending');
  });
});

describe('buildDailySeries', () => {
  it('fills missing days with zero counts', () => {
    const now = new Date('2026-08-28T15:00:00.000Z');
    const series = buildDailySeries(
      [{ date: '2026-08-27', count: 3 }],
      3,
      now,
    );

    expect(series).toEqual([
      { date: '2026-08-26', count: 0 },
      { date: '2026-08-27', count: 3 },
      { date: '2026-08-28', count: 0 },
    ]);
  });
});

describe('startOfDayDaysAgo', () => {
  it('returns midnight at the start of the range', () => {
    const start = startOfDayDaysAgo(7, new Date('2026-08-28T18:30:00.000Z'));
    expect(start.toISOString()).toBe('2026-08-22T00:00:00.000Z');
  });
});
