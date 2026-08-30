import { describe, it, expect } from 'vitest';
import { generateEventToken } from './event-token.js';

describe('generateEventToken', () => {
  it('generates unique high-entropy tokens', () => {
    const token1 = generateEventToken();
    const token2 = generateEventToken();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(32);
  });

  it('uses base64url encoding', () => {
    const token = generateEventToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
