import { denseSearch } from "@/lib/retrieval/dense-search";
import { mergeAndDeduplicate } from "@/lib/retrieval/merge";
import type { PipelineState } from "@/lib/pipeline/state";

const CANDIDATES_PER_QUERY = 10;

/** Retrieve node: dense-searches every query variant, then merges/deduplicates the candidates. */
export async function retrieveNode(state: PipelineState): Promise<Partial<PipelineState>> {
  if (!state.expandedQueries) throw new Error("retrieveNode requires expandedQueries");

  const resultSets = await Promise.all(
    state.expandedQueries.map((query) =>
      denseSearch(query, { courseSlug: state.courseSlug, topK: CANDIDATES_PER_QUERY })
    )
  );

  return { candidateChunks: mergeAndDeduplicate(resultSets) };
}
