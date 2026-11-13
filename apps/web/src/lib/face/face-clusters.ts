import { cosineSimilarity, type FaceEmbedding } from '@/lib/face/browser-face';
import type { FaceIndexRecord } from '@/lib/face/face-index';

export type FaceClusterSummary = {
  clusterId: string;
  label: string;
  avatarUrl: string;
  photoIds: string[];
  appearanceCount: number;
};

const SAME_PERSON_THRESHOLD = 0.58;

/** Stable across reloads — do not use random UUIDs per cluster. */
function stableClusterId(members: FaceIndexRecord[]): string {
  return members
    .map((m) => m.id)
    .sort()
    .join('__');
}

export function clusterRecordsForUi(records: FaceIndexRecord[]): FaceClusterSummary[] {
  if (records.length === 0) return [];

  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));

  const clusters: Array<{
    clusterId: string;
    centroid: FaceEmbedding;
    members: FaceIndexRecord[];
  }> = [];

  for (const record of sorted) {
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < clusters.length; i++) {
      const sim = cosineSimilarity(record.embedding, clusters[i]!.centroid);
      if (sim >= SAME_PERSON_THRESHOLD && sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      clusters[bestIdx]!.members.push(record);
    } else {
      clusters.push({
        clusterId: stableClusterId([record]),
        centroid: record.embedding,
        members: [record],
      });
    }
  }

  return clusters
    .map((cluster) => ({
      clusterId: stableClusterId(cluster.members),
      avatarUrl: cluster.members[0]?.avatarDataUrl ?? '',
      photoIds: [...new Set(cluster.members.map((m) => m.photoId))],
      appearanceCount: cluster.members.length,
    }))
    .sort((a, b) => b.appearanceCount - a.appearanceCount)
    .map((cluster, index) => ({
      ...cluster,
      label: `Person ${index + 1}`,
    }));
}
