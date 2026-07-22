import { getQdrantClient } from "@/lib/qdrant/client";
import { COLLECTION_NAME, DENSE_VECTOR_NAME } from "@/lib/qdrant/collection";
import type { Chunk } from "@/types/chunk";

export interface ChunkPoint {
  chunk: Chunk;
  denseVector: number[];
}

const UPSERT_BATCH_SIZE = 100;

function toQdrantPoint(point: ChunkPoint) {
  return {
    id: point.chunk.id,
    vector: {
      [DENSE_VECTOR_NAME]: point.denseVector,
    },
    payload: {
      text: point.chunk.text,
      ...point.chunk.metadata,
    },
  };
}

/** Upserts chunk points into Qdrant in fixed-size batches. */
export async function upsertChunks(points: ChunkPoint[]): Promise<void> {
  const client = getQdrantClient();

  for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
    const batch = points.slice(i, i + UPSERT_BATCH_SIZE);
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: batch.map(toQdrantPoint),
    });
  }
}
