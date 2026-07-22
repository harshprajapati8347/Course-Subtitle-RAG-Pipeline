import { cosineSimilarity, percentile } from "@/lib/utils";
import type { Sentence } from "@/types/subtitle";
import type { ChunkDraft } from "@/types/chunk";

export interface SemanticChunkOptions {
  /** Distances above this percentile mark a topic-shift breakpoint. */
  breakpointPercentile: number;
  /** Chunks smaller than this get merged into the next chunk. */
  minChunkChars: number;
  /** A breakpoint is forced once a chunk would exceed this size. */
  maxChunkChars: number;
}

const DEFAULT_OPTIONS: SemanticChunkOptions = {
  breakpointPercentile: 0.95,
  minChunkChars: 200,
  maxChunkChars: 1800,
};

type EmbedFn = (texts: string[]) => Promise<number[][]>;

/** Cosine distance (1 - similarity) between each pair of consecutive sentence embeddings. */
function computeConsecutiveDistances(embeddings: number[][]): number[] {
  const distances: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    distances.push(1 - cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }
  return distances;
}

/** Groups sentence indices into chunks, breaking on semantic distance spikes or a max size cap. */
function groupSentences(
  sentences: Sentence[],
  distances: number[],
  options: SemanticChunkOptions,
): Sentence[][] {
  const threshold = percentile(distances, options.breakpointPercentile);
  const groups: Sentence[][] = [];
  let current: Sentence[] = [sentences[0]];
  let currentChars = sentences[0].text.length;

  for (let i = 1; i < sentences.length; i++) {
    const sentence = sentences[i];
    const distance = distances[i - 1];
    const isSemanticBreak = distance > threshold;
    const isSizeBreak = currentChars + sentence.text.length > options.maxChunkChars;

    if (isSemanticBreak || isSizeBreak) {
      groups.push(current);
      current = [sentence];
      currentChars = sentence.text.length;
    } else {
      current.push(sentence);
      currentChars += sentence.text.length;
    }
  }
  groups.push(current);

  return groups;
}

/** Merges any chunk below the minimum size into the following chunk (or the previous one if last). */
function mergeSmallGroups(groups: Sentence[][], minChunkChars: number): Sentence[][] {
  const merged: Sentence[][] = [];

  for (const group of groups) {
    const groupChars = group.reduce((sum, s) => sum + s.text.length, 0);
    const previous = merged[merged.length - 1];

    if (groupChars < minChunkChars && previous) {
      previous.push(...group);
    } else {
      merged.push([...group]);
    }
  }

  return merged;
}

function toChunkDraft(group: Sentence[]): ChunkDraft {
  return {
    text: group.map((s) => s.text).join(" "),
    startMs: group[0].startMs,
    endMs: group[group.length - 1].endMs,
  };
}

/**
 * Splits sentences into semantically coherent chunks. Consecutive sentence
 * embeddings are compared; a large jump in distance signals a topic shift
 * and becomes a chunk boundary (the standard "semantic chunking" heuristic).
 */
export async function semanticChunk(
  sentences: Sentence[],
  embedFn: EmbedFn,
  options: Partial<SemanticChunkOptions> = {},
): Promise<ChunkDraft[]> {
  if (sentences.length === 0) return [];
  if (sentences.length === 1) return [toChunkDraft(sentences)];

  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const embeddings = await embedFn(sentences.map((s) => s.text));
  const distances = computeConsecutiveDistances(embeddings);

  const groups = groupSentences(sentences, distances, resolvedOptions);
  const mergedGroups = mergeSmallGroups(groups, resolvedOptions.minChunkChars);

  return mergedGroups.map(toChunkDraft);
}
