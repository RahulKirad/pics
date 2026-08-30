import { describe, it, expect } from 'vitest';

function dedupeByPhoto<T extends { photoId: string; score: number }>(matches: T[]): T[] {
  const byPhoto = new Map<string, T>();
  for (const match of matches) {
    const existing = byPhoto.get(match.photoId);
    if (!existing || match.score > existing.score) {
      byPhoto.set(match.photoId, match);
    }
  }
  return [...byPhoto.values()].sort((a, b) => b.score - a.score);
}

describe('dedupeByPhoto', () => {
  it('keeps the highest score per photo', () => {
    const matches = dedupeByPhoto([
      { photoId: 'a', photoFaceId: 'f1', score: 0.7 },
      { photoId: 'a', photoFaceId: 'f2', score: 0.9 },
      { photoId: 'b', photoFaceId: 'f3', score: 0.8 },
    ]);

    expect(matches).toHaveLength(2);
    expect(matches[0]?.photoId).toBe('a');
    expect(matches[0]?.score).toBe(0.9);
  });
});
