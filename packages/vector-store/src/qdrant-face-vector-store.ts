import { QdrantClient } from '@qdrant/js-client-rest';
import { loadEnv } from '@photo-platform/config';
import type { FaceVectorPayload, FaceVectorStore, VectorSearchMatch, VectorSearchOptions } from './types.js';

const DEFAULT_VECTOR_SIZE = 512;

function getCollectionName(): string {
  const env = loadEnv();
  return env.QDRANT_COLLECTION ?? 'photo_platform_faces';
}

export class QdrantFaceVectorStore implements FaceVectorStore {
  private client: QdrantClient;
  private collectionName: string;
  private ensuredSizes = new Set<number>();

  constructor(url?: string, collectionName?: string) {
    const env = loadEnv();
    this.client = new QdrantClient({ url: url ?? env.QDRANT_URL });
    this.collectionName = collectionName ?? getCollectionName();
  }

  async ensureCollection(vectorSize: number = DEFAULT_VECTOR_SIZE): Promise<void> {
    if (this.ensuredSizes.has(vectorSize)) {
      return;
    }

    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === this.collectionName);

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });

      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'eventId',
        field_schema: 'keyword',
      });

      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'photoId',
        field_schema: 'keyword',
      });

      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'businessId',
        field_schema: 'keyword',
      });
    }

    this.ensuredSizes.add(vectorSize);
  }

  async upsertPoint(pointId: string, vector: number[], payload: FaceVectorPayload): Promise<void> {
    await this.ensureCollection(vector.length);
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: {
            photoFaceId: payload.photoFaceId,
            photoId: payload.photoId,
            eventId: payload.eventId,
            businessId: payload.businessId,
            modelVersion: payload.modelVersion,
          },
        },
      ],
    });
  }

  async deletePoint(pointId: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      points: [pointId],
    });
  }

  async deleteByPhotoId(photoId: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [{ key: 'photoId', match: { value: photoId } }],
      },
    });
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [{ key: 'eventId', match: { value: eventId } }],
      },
    });
  }

  async searchByEvent(
    eventId: string,
    vector: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchMatch[]> {
    const limit = options.limit ?? 20;
    const threshold = options.threshold ?? 0.6;

    await this.ensureCollection(vector.length);

    const response = await this.client.query(this.collectionName, {
      query: vector,
      limit,
      score_threshold: threshold,
      filter: {
        must: [{ key: 'eventId', match: { value: eventId } }],
      },
      with_payload: true,
    });

    return response.points
      .map((result) => {
        const payload = result.payload as Record<string, unknown> | null;
        const photoFaceId = typeof payload?.photoFaceId === 'string' ? payload.photoFaceId : '';
        const photoId = typeof payload?.photoId === 'string' ? payload.photoId : '';
        if (!photoFaceId || !photoId) {
          return null;
        }
        return {
          photoFaceId,
          photoId,
          score: result.score ?? 0,
        };
      })
      .filter((match): match is VectorSearchMatch => match !== null);
  }
}

let store: QdrantFaceVectorStore | null = null;

export function getFaceVectorStore(): FaceVectorStore {
  if (!store) {
    store = new QdrantFaceVectorStore();
  }
  return store;
}

export function resetFaceVectorStore(): void {
  store = null;
}
