import type { ChunkMetadata } from "@/types/chunk";

/** A chunk returned from retrieval, carrying its similarity/relevance score. */
export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  metadata: ChunkMetadata;
}

/** Options shared by retrieval calls. */
export interface RetrievalOptions {
  /** Restrict results to a single course. Omit to search across all courses. */
  courseSlug?: string;
  /** Max number of candidates to return before reranking. */
  topK?: number;
}
