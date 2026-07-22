import { Annotation } from "@langchain/langgraph";
import type { RetrievedChunk } from "@/types/retrieval";
import type { Citation, CitationValidationResult } from "@/types/generation";
import type { GuardResult } from "@/types/guard";

/** Shorthand for a channel that's simply overwritten by whichever node sets it, unset by default. */
function optional<T>() {
  return Annotation<T | undefined>({ default: () => undefined, reducer: (_prev, next) => next });
}

/**
 * Full state threaded through the LangGraph pipeline. Populated
 * progressively as the question flows through guard → rewrite → expand →
 * retrieve → rerank → context → generate → validate.
 */
export const PipelineStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  courseSlug: optional<string>(),

  guard: optional<GuardResult>(),

  rewrittenQuery: optional<string>(),
  expandedQueries: optional<string[]>(),

  candidateChunks: optional<RetrievedChunk[]>(),
  rerankedChunks: optional<RetrievedChunk[]>(),

  contextText: optional<string>(),
  sources: optional<Citation[]>(),

  answer: optional<string>(),
  citations: optional<Citation[]>(),
  validation: optional<CitationValidationResult>(),

  /** Number of generation attempts made so far; used to cap the validate→generate retry loop. */
  retryCount: Annotation<number>({ default: () => 0, reducer: (_prev, next) => next }),
});

export type PipelineState = typeof PipelineStateAnnotation.State;
