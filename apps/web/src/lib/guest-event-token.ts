/** Normalize token from QR, SMS, or copied links (trim, strip trailing slashes). */
export function normalizeGuestEventToken(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\/+$/g, '').toLowerCase();
}

export function isLocalHost(): boolean {
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  return h === 'localhost' || h === '127.0.0.1';
}