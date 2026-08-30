import type {
  BoundingBox,
  DetectedFace,
  FaceDetectionResult,
  FaceEmbeddingResult,
  FaceMatchCandidate,
  FaceMatchResult,
  FaceQualityResult,
} from '@photo-platform/shared-types';

export interface FaceRecognitionProvider {
  detectFaces(image: Buffer, mimeType?: string): Promise<FaceDetectionResult>;
  generateEmbedding(
    image: Buffer,
    options?: { mimeType?: string; boundingBox?: BoundingBox },
  ): Promise<FaceEmbeddingResult>;
  matchFaces(
    queryEmbedding: number[],
    candidates: FaceMatchCandidate[],
    options?: { threshold?: number; topK?: number },
  ): Promise<{ matches: FaceMatchResult[]; threshold: number }>;
  checkQuality(
    image: Buffer,
    options?: { mimeType?: string; boundingBox?: BoundingBox },
  ): Promise<FaceQualityResult>;
  healthCheck(): Promise<{ healthy: boolean; engine?: string }>;
}

export type {
  BoundingBox,
  DetectedFace,
  FaceDetectionResult,
  FaceEmbeddingResult,
  FaceMatchCandidate,
  FaceMatchResult,
  FaceQualityResult,
};
