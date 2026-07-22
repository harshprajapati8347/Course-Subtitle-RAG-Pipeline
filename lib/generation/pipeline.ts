import { buildContext } from "@/lib/generation/context-builder";
import { generateAnswer } from "@/lib/generation/generate-answer";
import { resolveCitations, validateCitations } from "@/lib/generation/citations";
import type { RetrievedChunk } from "@/types/retrieval";
import type { GeneratedAnswer } from "@/types/generation";

/**
 * Phase 4 generation pipeline: builds a numbered context block from
 * retrieved chunks, generates a grounded answer that cites sources with
 * `[n]` markers, then resolves and validates those citations.
 */
export async function generateGroundedAnswer(
  question: string,
  chunks: RetrievedChunk[]
): Promise<GeneratedAnswer> {
  const { contextText, sources } = buildContext(chunks);
  const answer = await generateAnswer(question, contextText);

  return {
    question,
    answer,
    citations: resolveCitations(answer, sources),
    validation: validateCitations(answer, sources),
  };
}
