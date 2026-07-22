import type { Citation, CitationValidationResult } from "@/types/generation";

const CITATION_MARKER_REGEX = /\[(\d+)\]/g;

/** Extracts all unique citation marker numbers (e.g. the `1` in `[1]`) referenced in an answer. */
export function extractCitationIndexes(answer: string): number[] {
  const indexes = new Set<number>();
  for (const match of answer.matchAll(CITATION_MARKER_REGEX)) {
    indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

/**
 * Validates that every citation marker in the answer refers to a real
 * source from the context. Marker numbers outside the context's source
 * range are treated as hallucinated citations.
 */
export function validateCitations(answer: string, sources: Citation[]): CitationValidationResult {
  const referenced = extractCitationIndexes(answer);
  const validIndexSet = new Set(sources.map((source) => source.index));

  const validIndexes = referenced.filter((index) => validIndexSet.has(index));
  const invalidIndexes = referenced.filter((index) => !validIndexSet.has(index));

  return {
    isValid: invalidIndexes.length === 0,
    validIndexes,
    invalidIndexes,
  };
}

/** Resolves the citation markers actually used in an answer to their full source metadata. */
export function resolveCitations(answer: string, sources: Citation[]): Citation[] {
  const referenced = new Set(extractCitationIndexes(answer));
  return sources.filter((source) => referenced.has(source.index));
}
