import { buildContext } from "@/lib/generation/context-builder";
import type { PipelineState } from "@/lib/pipeline/state";

/** Context node: formats the reranked chunks into a numbered context block for generation. */
export function contextNode(state: PipelineState): Partial<PipelineState> {
  if (!state.rerankedChunks) throw new Error("contextNode requires rerankedChunks");

  const { contextText, sources } = buildContext(state.rerankedChunks);
  return { contextText, sources };
}
