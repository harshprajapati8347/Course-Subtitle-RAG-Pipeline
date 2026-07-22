import type { ChunkMetadata } from "@/types/chunk";

/** A single citation resolved from a `[n]` marker in a generated answer. */
export interface Citation {
  index: number;
  chunkId: string;
  metadata: ChunkMetadata;
}

/** Result of checking whether every citation marker in an answer is backed by a real source. */
export interface CitationValidationResult {
  isValid: boolean;
  validIndexes: number[];
  invalidIndexes: number[];
}

/** Final output of the Phase 4 generation pipeline. */
export interface GeneratedAnswer {
  question: string;
  answer: string;
  citations: Citation[];
  validation: CitationValidationResult;
}
