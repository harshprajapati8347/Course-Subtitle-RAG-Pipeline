import { createHash } from "crypto";

/**
 * Builds a deterministic UUID-shaped string from the given parts.
 * Re-ingesting the same source content produces the same point ID,
 * so Qdrant upserts overwrite existing points instead of duplicating them.
 */
export function makeDeterministicId(...parts: string[]): string {
  const hash = createHash("sha1").update(parts.join("::")).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}
