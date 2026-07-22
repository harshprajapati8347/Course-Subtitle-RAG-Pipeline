import { rewriteQuery } from "@/lib/retrieval/query-rewrite";
import { expandQuery } from "@/lib/retrieval/multi-query";
import { denseSearch } from "@/lib/retrieval/dense-search";
import { mergeAndDeduplicate } from "@/lib/retrieval/merge";
import { rerankChunks } from "@/lib/reranker/cohere";
import type { RetrievalOptions, RetrievedChunk } from "@/types/retrieval";

/** Candidates fetched per query variant, before merging/deduplication. */
const CANDIDATES_PER_QUERY = 10;
/** Final number of chunks returned after reranking. */
const FINAL_TOP_N = 5;

export interface RetrievalResult {
  originalQuestion: string;
  rewrittenQuery: string;
  expandedQueries: string[];
  chunks: RetrievedChunk[];
}

/**
 * Phase 3 retrieval pipeline: rewrite the question, expand it into several
 * query variants, dense-search each variant, merge/deduplicate the
 * candidates, then rerank against the rewritten query for the final
 * top-N most relevant chunks.
 */
export async function retrieveTopChunks(
  question: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const rewrittenQuery = await rewriteQuery(question);
  const expandedQueries = await expandQuery(rewrittenQuery);

  const resultSets = await Promise.all(
    expandedQueries.map((query) =>
      denseSearch(query, { ...options, topK: options.topK ?? CANDIDATES_PER_QUERY })
    )
  );

  const merged = mergeAndDeduplicate(resultSets);
  const chunks = await rerankChunks(rewrittenQuery, merged, FINAL_TOP_N);

  return { originalQuestion: question, rewrittenQuery, expandedQueries, chunks };
}
