import { rerankChunks } from "@/lib/reranker/cohere";
import type { PipelineState } from "@/lib/pipeline/state";

const FINAL_TOP_N = 5;

/** Rerank node: reorders merged candidates by relevance to the rewritten query, keeping the top N. */
export async function rerankNode(state: PipelineState): Promise<Partial<PipelineState>> {
  if (!state.candidateChunks) throw new Error("rerankNode requires candidateChunks");
  if (!state.rewrittenQuery) throw new Error("rerankNode requires rewrittenQuery");

  const rerankedChunks = await rerankChunks(state.rewrittenQuery, state.candidateChunks, FINAL_TOP_N);
  return { rerankedChunks };
}
