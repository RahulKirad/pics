import { describe, it, expect } from 'vitest';
import { wrapBrandedSvg } from './qr-generator.js';

describe('wrapBrandedSvg', () => {
  it('adds event label below QR svg', () => {
    const qrSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400"/></svg>';
    const branded = wrapBrandedSvg(qrSvg, 'Wedding Day', 400);

    expect(branded).toContain('Wedding Day');
    expect(branded).toContain('viewBox="0 0 400 456"');
  });
});
