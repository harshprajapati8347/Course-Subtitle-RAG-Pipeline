/** A single subtitle cue parsed from a .srt or .vtt file. */
export interface SubtitleCue {
  text: string;
  startMs: number;
  endMs: number;
}

/** A sentence reconstructed from cues, with interpolated timestamps. */
export interface Sentence {
  text: string;
  startMs: number;
  endMs: number;
}
