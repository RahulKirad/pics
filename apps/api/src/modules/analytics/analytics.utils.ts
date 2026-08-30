import type { DailyMetric } from '@photo-platform/shared-types';

export function deriveSearchStatus(search: {
  processingMs: number | null;
  errorMessage: string | null;
}): 'pending' | 'complete' | 'failed' {
  if (search.errorMessage) return 'failed';
  if (search.processingMs !== null) return 'complete';
  return 'pending';
}

export function buildDailySeries(
  rows: { date: string; count: number }[],
  days: number,
  now = new Date(),
): DailyMetric[] {
  const counts = new Map(rows.map((row) => [row.date, row.count]));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const series: DailyMetric[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return series;
}

export function startOfDayDaysAgo(days: number, now = new Date()): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

export function formatSqlDate(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}
