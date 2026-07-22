import { formatTimestamp } from "@/lib/utils";
import type { RetrievedChunk } from "@/types/retrieval";
import type { Citation } from "@/types/generation";

export interface BuiltContext {
  contextText: string;
  sources: Citation[];
}

/**
 * Formats retrieved chunks into a numbered context block for the
 * generation prompt. Each chunk becomes a `[n]` source the model can
 * cite; `sources` maps those numbers back to citation metadata so the
 * answer's citations can be resolved/validated afterward.
 */
export function buildContext(chunks: RetrievedChunk[]): BuiltContext {
  const sources: Citation[] = chunks.map((chunk, i) => ({
    index: i + 1,
    chunkId: chunk.id,
    metadata: chunk.metadata,
  }));

  const contextText = chunks
    .map((chunk, i) => {
      const { course, module, lesson, startMs, endMs } = chunk.metadata;
      const header = `[${i + 1}] Course: ${course} | Module: ${module} | Lesson: ${lesson} (${formatTimestamp(startMs)}-${formatTimestamp(endMs)})`;
      return `${header}\n${chunk.text}`;
    })
    .join("\n\n");

  return { contextText, sources };
}
