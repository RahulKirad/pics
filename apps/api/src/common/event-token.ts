import { randomBytes } from 'crypto';

export function generateEventToken(): string {
  return randomBytes(32).toString('base64url');
}
