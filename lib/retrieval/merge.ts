import type { RetrievedChunk } from "@/types/retrieval";

/**
 * Merges result sets from multiple query variants into one deduplicated
 * list, keeping the highest score seen for each chunk id, sorted
 * descending by score.
 */
export function mergeAndDeduplicate(resultSets: RetrievedChunk[][]): RetrievedChunk[] {
  const byId = new Map<string, RetrievedChunk>();

  for (const results of resultSets) {
    for (const chunk of results) {
      const existing = byId.get(chunk.id);
      if (!existing || chunk.score > existing.score) {
        byId.set(chunk.id, chunk);
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score);
}
