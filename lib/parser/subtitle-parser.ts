import { readFile } from "fs/promises";
import { parseSync, type NodeCue } from "subtitle";
import type { SubtitleCue } from "@/types/subtitle";

function isCueNode(node: { type: string }): node is NodeCue {
  return node.type === "cue";
}

/**
 * Parses a .srt or .vtt file into subtitle cues.
 * The `subtitle` package auto-detects the format, so no extension check is needed.
 */
export async function parseSubtitleFile(filePath: string): Promise<SubtitleCue[]> {
  const raw = await readFile(filePath, "utf-8");
  const nodes = parseSync(raw);

  return nodes
    .filter(isCueNode)
    .map((node) => ({
      text: node.data.text.replace(/\s+/g, " ").trim(),
      startMs: node.data.start,
      endMs: node.data.end,
    }))
    .filter((cue) => cue.text.length > 0);
}
