import type { SubtitleCue, Sentence } from "@/types/subtitle";

interface TimedWord {
  text: string;
  ms: number;
}

const SENTENCE_END = /[.?!]["')\]]*$/;

/** Flattens cues into words, interpolating a timestamp for each word within its cue's time range. */
function cuesToTimedWords(cues: SubtitleCue[]): TimedWord[] {
  const words: TimedWord[] = [];

  for (const cue of cues) {
    const cueWords = cue.text.split(/\s+/).filter(Boolean);
    if (cueWords.length === 0) continue;

    const duration = cue.endMs - cue.startMs;
    cueWords.forEach((text, index) => {
      const ms = cue.startMs + Math.round((duration * index) / cueWords.length);
      words.push({ text, ms });
    });
  }

  return words;
}

function finalizeSentence(words: TimedWord[]): Sentence {
  return {
    text: words.map((word) => word.text).join(" "),
    startMs: words[0].ms,
    endMs: words[words.length - 1].ms,
  };
}

/**
 * Reconstructs sentences from subtitle cues. Subtitle cues rarely align
 * with sentence boundaries, so cues are first flattened into timestamped
 * words and then regrouped on `.`/`?`/`!` boundaries.
 */
export function buildSentences(cues: SubtitleCue[]): Sentence[] {
  const words = cuesToTimedWords(cues);
  const sentences: Sentence[] = [];
  let buffer: TimedWord[] = [];

  for (const word of words) {
    buffer.push(word);
    if (SENTENCE_END.test(word.text)) {
      sentences.push(finalizeSentence(buffer));
      buffer = [];
    }
  }

  if (buffer.length > 0) sentences.push(finalizeSentence(buffer));

  return sentences;
}
