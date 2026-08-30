import { randomBytes } from 'crypto';

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const suffix = randomBytes(3).toString('hex');
  return base ? `${base}-${suffix}` : `studio-${suffix}`;
}
