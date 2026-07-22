import { rewriteQuery } from "@/lib/retrieval/query-rewrite";
import type { PipelineState } from "@/lib/pipeline/state";

/** Rewrite node: turns the raw question into one clear, standalone search query. */
export async function rewriteNode(state: PipelineState): Promise<Partial<PipelineState>> {
  const rewrittenQuery = await rewriteQuery(state.question);
  return { rewrittenQuery };
}
