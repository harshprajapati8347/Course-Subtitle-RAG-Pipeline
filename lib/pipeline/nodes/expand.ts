import { expandQuery } from "@/lib/retrieval/multi-query";
import type { PipelineState } from "@/lib/pipeline/state";

/** Expand node: generates diverse query variants from the rewritten query to improve recall. */
export async function expandNode(state: PipelineState): Promise<Partial<PipelineState>> {
  if (!state.rewrittenQuery) throw new Error("expandNode requires rewrittenQuery");

  const expandedQueries = await expandQuery(state.rewrittenQuery);
  return { expandedQueries };
}
