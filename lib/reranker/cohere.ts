import { CohereRerank } from "@langchain/cohere";
import { getEnv } from "@/lib/env";
import type { RetrievedChunk } from "@/types/retrieval";

export const RERANK_MODEL = "rerank-v3.5";

let reranker: CohereRerank | null = null;

function getReranker(): CohereRerank {
  if (!reranker) {
    reranker = new CohereRerank({ apiKey: getEnv().COHERE_API_KEY, model: RERANK_MODEL });
  }
  return reranker;
}

/**
 * Reranks merged candidate chunks against the query using Cohere Rerank,
 * replacing each chunk's dense-similarity score with Cohere's relevance
 * score and truncating to the top `topN`.
 */
export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topN: number
): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) return [];

  const documents = chunks.map((chunk) => chunk.text);
  const ranked = await getReranker().rerank(documents, query, { topN });

  return ranked.map(({ index, relevanceScore }) => ({
    ...chunks[index],
    score: relevanceScore,
  }));
}
