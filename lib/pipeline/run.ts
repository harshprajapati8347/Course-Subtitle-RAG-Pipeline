import { getPipelineGraph } from "@/lib/pipeline/graph";
import type { PipelineState } from "@/lib/pipeline/state";

export interface RunPipelineOptions {
  courseSlug?: string;
}

/**
 * Runs the full LangGraph-orchestrated pipeline for a single question:
 * guard → rewrite → expand → retrieve → rerank → context → generate →
 * validate (retrying generation on hallucinated citations).
 */
export async function runPipeline(
  question: string,
  options: RunPipelineOptions = {}
): Promise<PipelineState> {
  return getPipelineGraph().invoke({
    question,
    courseSlug: options.courseSlug,
  });
}
