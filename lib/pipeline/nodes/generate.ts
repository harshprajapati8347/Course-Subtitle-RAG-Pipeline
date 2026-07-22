import { generateAnswer } from "@/lib/generation/generate-answer";
import type { PipelineState } from "@/lib/pipeline/state";

/**
 * Generate node: produces a cited answer from the context. On a retry
 * (after invalid citations), passes the previous validation failure back
 * to the model as feedback so it can self-correct.
 */
export async function generateNode(state: PipelineState): Promise<Partial<PipelineState>> {
  if (!state.contextText) throw new Error("generateNode requires contextText");

  const feedback =
    state.validation && !state.validation.isValid
      ? `Your previous answer cited source marker(s) that don't exist: ${state.validation.invalidIndexes.join(", ")}. Only use [n] markers for sources actually listed in the context above.`
      : undefined;

  const answer = await generateAnswer(state.question, state.contextText, feedback);
  return { answer };
}
