import { getQdrantClient } from "@/lib/qdrant/client";
import { DENSE_VECTOR_SIZE } from "@/lib/embeddings/dense";

/** Single collection for all courses; `courseSlug` in the payload filters by course. */
export const COLLECTION_NAME = "advanced_rag_chunks";

export const DENSE_VECTOR_NAME = "dense";

/** Creates the collection with a named dense vector if it doesn't already exist. */
export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  const exists = await client.collectionExists(COLLECTION_NAME);
  if (exists.exists) return;

  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      [DENSE_VECTOR_NAME]: {
        size: DENSE_VECTOR_SIZE,
        distance: "Cosine",
      },
    },
  });
}
