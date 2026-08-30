import { loadEnv } from '@photo-platform/config';
import type {
  BoundingBox,
  FaceDetectionResult,
  FaceEmbeddingResult,
  FaceMatchCandidate,
  FaceMatchResult,
  FaceQualityResult,
} from '@photo-platform/shared-types';
import type { FaceRecognitionProvider } from './types.js';

function getBaseUrl(): string {
  return loadEnv().AI_SERVICE_URL.replace(/\/$/, '');
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { detail?: string; error?: { message?: string } };
    return body.detail ?? body.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function buildFormData(image: Buffer, mimeType: string, boundingBox?: BoundingBox): FormData {
  const form = new FormData();
  const blob = new Blob([Uint8Array.from(image)], { type: mimeType });
  form.append('image', blob, 'image.jpg');
  if (boundingBox) {
    form.append('bounding_box', JSON.stringify(boundingBox));
  }
  return form;
}

export class HttpFaceRecognitionProvider implements FaceRecognitionProvider {
  constructor(private readonly baseUrl = getBaseUrl()) {}

  async detectFaces(image: Buffer, mimeType = 'image/jpeg'): Promise<FaceDetectionResult> {
    const form = buildFormData(image, mimeType);
    const response = await fetch(`${this.baseUrl}/api/v1/faces/detect`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`Face detection failed: ${await parseError(response)}`);
    }

    const data = await response.json() as {
      faces: Array<{
        bounding_box: BoundingBox;
        confidence: number;
        quality_score?: number;
        landmarks?: Record<string, number>;
      }>;
      count: number;
      model_version: string;
    };

    return {
      faces: data.faces.map((face) => ({
        boundingBox: face.bounding_box,
        confidence: face.confidence,
        qualityScore: face.quality_score,
        landmarks: face.landmarks,
      })),
      count: data.count,
      modelVersion: data.model_version,
    };
  }

  async generateEmbedding(
    image: Buffer,
    options?: { mimeType?: string; boundingBox?: BoundingBox },
  ): Promise<FaceEmbeddingResult> {
    const form = buildFormData(image, options?.mimeType ?? 'image/jpeg', options?.boundingBox);
    const response = await fetch(`${this.baseUrl}/api/v1/faces/embedding`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`Face embedding failed: ${await parseError(response)}`);
    }

    const data = await response.json() as {
      embedding: number[];
      model_version: string;
      dimensions: number;
    };

    return {
      embedding: data.embedding,
      modelVersion: data.model_version,
      dimensions: data.dimensions,
    };
  }

  async matchFaces(
    queryEmbedding: number[],
    candidates: FaceMatchCandidate[],
    options?: { threshold?: number; topK?: number },
  ): Promise<{ matches: FaceMatchResult[]; threshold: number }> {
    const response = await fetch(`${this.baseUrl}/api/v1/faces/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        candidates: candidates.map((c) => ({ id: c.id, embedding: c.embedding })),
        threshold: options?.threshold ?? 0.6,
        top_k: options?.topK ?? 20,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Face matching failed: ${await parseError(response)}`);
    }

    const data = await response.json() as {
      matches: Array<{ id: string; similarity: number }>;
      threshold: number;
    };

    return {
      matches: data.matches.map((m) => ({ id: m.id, similarity: m.similarity })),
      threshold: data.threshold,
    };
  }

  async checkQuality(
    image: Buffer,
    options?: { mimeType?: string; boundingBox?: BoundingBox },
  ): Promise<FaceQualityResult> {
    const form = buildFormData(image, options?.mimeType ?? 'image/jpeg', options?.boundingBox);
    const response = await fetch(`${this.baseUrl}/api/v1/faces/quality-check`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Face quality check failed: ${await parseError(response)}`);
    }

    const data = await response.json() as FaceQualityResult;
    return data;
  }

  async healthCheck(): Promise<{ healthy: boolean; engine?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return { healthy: false };
      const data = await response.json() as { status: string; engine?: string };
      return { healthy: data.status === 'healthy', engine: data.engine };
    } catch {
      return { healthy: false };
    }
  }
}

let provider: HttpFaceRecognitionProvider | null = null;

export function getFaceRecognitionProvider(): FaceRecognitionProvider {
  if (!provider) {
    provider = new HttpFaceRecognitionProvider();
  }
  return provider;
}

export function resetFaceRecognitionProvider(): void {
  provider = null;
}
