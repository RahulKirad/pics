import type { BoundingBox } from '@photo-platform/shared-types';
import { getFaceRecognitionProvider } from '@photo-platform/ai-client';
import { getFaceVectorStore } from '@photo-platform/vector-store';
import { prisma } from '../database/client.js';
import { getStorageProvider } from '../storage/storage.factory.js';

const MATCH_LIMIT = 50;

function pickPrimaryFace(
  faces: Array<{ boundingBox: BoundingBox; confidence: number }>,
): { boundingBox: BoundingBox; confidence: number } | null {
  if (faces.length === 0) return null;
  return faces.reduce((best, face) => {
    const area = face.boundingBox.width * face.boundingBox.height;
    const bestArea = best.boundingBox.width * best.boundingBox.height;
    return area > bestArea ? face : best;
  });
}

async function downloadImage(key: string): Promise<Buffer> {
  const storage = getStorageProvider();
  const stream = await storage.download(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function dedupeByPhoto<T extends { photoId: string; score: number }>(matches: T[]): T[] {
  const byPhoto = new Map<string, T>();
  for (const match of matches) {
    const existing = byPhoto.get(match.photoId);
    if (!existing || match.score > existing.score) {
      byPhoto.set(match.photoId, match);
    }
  }
  return [...byPhoto.values()].sort((a, b) => b.score - a.score);
}

export async function runGuestFaceSearch(guestSearchId: string): Promise<{ matchCount: number }> {
  const startedAt = Date.now();
  const search = await prisma.guestSearch.findUnique({
    where: { id: guestSearchId },
  });

  if (!search) {
    throw new Error(`Guest search not found: ${guestSearchId}`);
  }

  if (search.processingMs !== null) {
    return { matchCount: search.matchCount };
  }

  if (!search.selfieStorageKey) {
    throw new Error(`Guest search ${guestSearchId} has no selfie`);
  }

  try {
    const selfie = await downloadImage(search.selfieStorageKey);
    const meta = await getStorageProvider().getMetadata(search.selfieStorageKey);
    const mimeType = meta?.mimeType ?? 'image/jpeg';

    const provider = getFaceRecognitionProvider();
    const detection = await provider.detectFaces(selfie, mimeType);
    const primaryFace = pickPrimaryFace(detection.faces);

    if (!primaryFace) {
      await prisma.$transaction(async (tx) => {
        await tx.guestSearchMatch.deleteMany({ where: { guestSearchId } });
        await tx.guestSearch.update({
          where: { id: guestSearchId },
          data: {
            matchCount: 0,
            processingMs: Date.now() - startedAt,
            embeddingStored: false,
            errorMessage: null,
          },
        });
      });
      return { matchCount: 0 };
    }

    const embedding = await provider.generateEmbedding(selfie, {
      mimeType,
      boundingBox: primaryFace.boundingBox,
    });

    const vectorStore = getFaceVectorStore();
    const rawMatches = await vectorStore.searchByEvent(search.eventId, embedding.embedding, {
      threshold: search.similarityThreshold,
      limit: MATCH_LIMIT * 2,
    });

    const matches = dedupeByPhoto(rawMatches).slice(0, MATCH_LIMIT);

    await prisma.$transaction(async (tx) => {
      await tx.guestSearchMatch.deleteMany({ where: { guestSearchId } });

      if (matches.length > 0) {
        await tx.guestSearchMatch.createMany({
          data: matches.map((match, index) => ({
            guestSearchId,
            photoId: match.photoId,
            photoFaceId: match.photoFaceId,
            similarity: match.score,
            rank: index + 1,
          })),
        });
      }

      await tx.guestSearch.update({
        where: { id: guestSearchId },
        data: {
          matchCount: matches.length,
          processingMs: Date.now() - startedAt,
          embeddingStored: true,
          errorMessage: null,
        },
      });
    });

    return { matchCount: matches.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Guest face search failed';
    await prisma.guestSearch.update({
      where: { id: guestSearchId },
      data: {
        processingMs: Date.now() - startedAt,
        errorMessage: message,
      },
    });
    throw error;
  }
}
