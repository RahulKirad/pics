export interface FaceVectorPayload {
  photoFaceId: string;
  photoId: string;
  eventId: string;
  businessId: string;
  modelVersion: string;
}

export interface VectorSearchMatch {
  photoFaceId: string;
  photoId: string;
  score: number;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
}

export interface FaceVectorStore {
  ensureCollection(vectorSize: number): Promise<void>;
  upsertPoint(pointId: string, vector: number[], payload: FaceVectorPayload): Promise<void>;
  deletePoint(pointId: string): Promise<void>;
  deleteByPhotoId(photoId: string): Promise<void>;
  deleteByEventId(eventId: string): Promise<void>;
  searchByEvent(
    eventId: string,
    vector: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchMatch[]>;
}
