/** Order + display title parsed from a course/module/lesson folder name. */
export interface FolderMeta {
  order: number;
  title: string;
}

const LESSON_SUFFIX = /_epm$/i;
const LEADING_NUMBER = /^\s*(\d+)[.\-_)]*\s*/;
const MODULE_NUMBER = /module\s*(\d+)/i;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Parses a module folder name like "module 3" or "module 1 hc". */
export function parseModuleFolderName(folderName: string, fallbackOrder: number): FolderMeta {
  const match = folderName.match(MODULE_NUMBER);
  const order = match ? parseInt(match[1], 10) : fallbackOrder;
  return { order, title: folderName.trim() };
}

/**
 * Parses a lesson folder name into an order + human-readable title.
 * Course exports use inconsistent naming (e.g. "01_topic_epm", "3.Topic",
 * "chapter-1_epm"), so a leading number is used when present and the
 * discovery index is used as a fallback otherwise.
 */
export function parseLessonFolderName(folderName: string, fallbackOrder: number): FolderMeta {
  const cleaned = folderName.replace(LESSON_SUFFIX, "").trim();
  const match = cleaned.match(LEADING_NUMBER);
  const order = match ? parseInt(match[1], 10) : fallbackOrder;
  const rest = match ? cleaned.slice(match[0].length) : cleaned;
  const title = rest.replace(/[-_]+/g, " ").trim();

  return { order, title: title.length > 0 ? title : cleaned };
}
