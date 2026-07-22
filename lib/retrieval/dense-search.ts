import { getQdrantClient } from "@/lib/qdrant/client";
import { COLLECTION_NAME, DENSE_VECTOR_NAME } from "@/lib/qdrant/collection";
import { embedQuery } from "@/lib/embeddings/dense";
import type { ChunkMetadata } from "@/types/chunk";
import type { RetrievalOptions, RetrievedChunk } from "@/types/retrieval";

const DEFAULT_TOP_K = 10;

interface QdrantScoredPoint {
  id: string | number;
  score: number;
  payload?: Record<string, unknown> | null;
}

function toRetrievedChunk(point: QdrantScoredPoint): RetrievedChunk {
  const { text, ...metadata } = (point.payload ?? {}) as unknown as { text: string } & ChunkMetadata;
  return {
    id: String(point.id),
    text,
    score: point.score,
    metadata,
  };
}

/** Embedding-similarity search against Qdrant's dense vector for a single query string. */
export async function denseSearch(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const vector = await embedQuery(query);
  const client = getQdrantClient();

  const response = await client.query(COLLECTION_NAME, {
    query: vector,
    using: DENSE_VECTOR_NAME,
    limit: options.topK ?? DEFAULT_TOP_K,
    with_payload: true,
    filter: options.courseSlug
      ? { must: [{ key: "courseSlug", match: { value: options.courseSlug } }] }
      : undefined,
  });

  return response.points.map(toRetrievedChunk);
}
