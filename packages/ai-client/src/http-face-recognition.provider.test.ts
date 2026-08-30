import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpFaceRecognitionProvider } from './http-face-recognition.provider.js';

describe('HttpFaceRecognitionProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps detect response to shared types', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        faces: [
          {
            bounding_box: { x: 10, y: 20, width: 100, height: 120 },
            confidence: 0.95,
            quality_score: 0.8,
          },
        ],
        count: 1,
        model_version: 'buffalo_sc',
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const provider = new HttpFaceRecognitionProvider('http://localhost:8000');
    const result = await provider.detectFaces(Buffer.from('fake'), 'image/jpeg');

    expect(result.count).toBe(1);
    expect(result.faces[0].boundingBox.width).toBe(100);
    expect(result.modelVersion).toBe('buffalo_sc');
  });

  it('reports unhealthy when health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const provider = new HttpFaceRecognitionProvider('http://localhost:8000');
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(false);
  });
});
