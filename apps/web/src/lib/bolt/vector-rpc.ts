/** pgvector values for Supabase/PostgREST RPC (hosted Bolt). */

export function toPgVector(embedding: number[]): string {
  return `[${embedding.map((n) => Number(n)).join(',')}]`;
}

/** JSONB array of vector literals for `store_photo_embeddings`. */
export function embeddingsForStoreRpc(embeddings: number[][]): string[] {
  return embeddings.map(toPgVector);
}
