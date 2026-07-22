import { resolveCitations, validateCitations } from "@/lib/generation/citations";
import type { PipelineState } from "@/lib/pipeline/state";

/** Validate node: checks the answer's citations against the context sources and resolves them. */
export function validateNode(state: PipelineState): Partial<PipelineState> {
  if (!state.answer) throw new Error("validateNode requires answer");
  if (!state.sources) throw new Error("validateNode requires sources");

  return {
    validation: validateCitations(state.answer, state.sources),
    citations: resolveCitations(state.answer, state.sources),
    retryCount: (state.retryCount ?? 0) + 1,
  };
}
