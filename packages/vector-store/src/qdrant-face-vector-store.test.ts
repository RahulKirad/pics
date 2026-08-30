import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = {
  getCollections: vi.fn(),
  createCollection: vi.fn(),
  createPayloadIndex: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  search: vi.fn(),
  query: vi.fn(),
};

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn(() => mockClient),
}));

vi.mock('@photo-platform/config', () => ({
  loadEnv: () => ({
    QDRANT_URL: 'http://localhost:6333',
    QDRANT_COLLECTION: 'test_faces',
  }),
}));

describe('QdrantFaceVectorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.getCollections.mockResolvedValue({ collections: [] });
    mockClient.createCollection.mockResolvedValue(true);
    mockClient.createPayloadIndex.mockResolvedValue(true);
    mockClient.upsert.mockResolvedValue(true);
    mockClient.query.mockResolvedValue({
      points: [
        {
          score: 0.91,
          payload: { photoFaceId: 'face-1', photoId: 'photo-1' },
        },
      ],
    });
  });

  it('creates collection and indexes a point', async () => {
    const { QdrantFaceVectorStore } = await import('./qdrant-face-vector-store.js');
    const store = new QdrantFaceVectorStore();
    const vector = Array.from({ length: 512 }, () => 0.01);

    await store.upsertPoint('point-1', vector, {
      photoFaceId: 'face-1',
      photoId: 'photo-1',
      eventId: 'event-1',
      businessId: 'biz-1',
      modelVersion: 'test',
    });

    expect(mockClient.createCollection).toHaveBeenCalled();
    expect(mockClient.upsert).toHaveBeenCalled();
  });

  it('searches with mandatory event filter', async () => {
    const { QdrantFaceVectorStore } = await import('./qdrant-face-vector-store.js');
    const store = new QdrantFaceVectorStore();
    const vector = Array.from({ length: 512 }, () => 0.01);

    const matches = await store.searchByEvent('event-1', vector, { threshold: 0.6, limit: 5 });

    expect(mockClient.query).toHaveBeenCalledWith(
      'test_faces',
      expect.objectContaining({
        filter: { must: [{ key: 'eventId', match: { value: 'event-1' } }] },
      }),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].photoFaceId).toBe('face-1');
  });
});
