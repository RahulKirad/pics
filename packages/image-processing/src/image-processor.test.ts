import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImageVariants } from './image-processor.js';

async function createTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe('processImageVariants', () => {
  it('generates thumbnail, preview, watermarked, and AI variants', async () => {
    const input = await createTestImage(3000, 2000);
    const result = await processImageVariants(input, { watermarkText: 'Test Event' });

    expect(result.width).toBe(3000);
    expect(result.height).toBe(2000);

    const thumbMeta = await sharp(result.thumbnail).metadata();
    expect(thumbMeta.width).toBeLessThanOrEqual(400);
    expect(thumbMeta.height).toBeLessThanOrEqual(400);

    const previewMeta = await sharp(result.preview).metadata();
    expect(previewMeta.width).toBeLessThanOrEqual(1920);

    const aiMeta = await sharp(result.aiCopy).metadata();
    expect(aiMeta.width).toBeLessThanOrEqual(2048);
    expect(aiMeta.height).toBeLessThanOrEqual(2048);

    expect(result.watermarked.length).toBeGreaterThan(0);
  });
});
