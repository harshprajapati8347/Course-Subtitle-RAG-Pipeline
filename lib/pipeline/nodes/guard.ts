import { runInputGuard } from "@/lib/guard/input-guard";
import type { PipelineState } from "@/lib/pipeline/state";

/** Guard node: validates the raw question before any LLM/retrieval spend. */
export async function guardNode(state: PipelineState): Promise<Partial<PipelineState>> {
  const guard = await runInputGuard(state.question);
  return { guard };
}
