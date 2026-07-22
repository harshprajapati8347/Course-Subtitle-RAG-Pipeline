import path from "path";
import { discoverLessons } from "@/lib/ingestion/discover";
import { parseSubtitleFile } from "@/lib/parser/subtitle-parser";
import { slugify } from "@/lib/parser/metadata";
import { buildSentences } from "@/lib/chunking/sentence-splitter";
import { semanticChunk } from "@/lib/chunking/semantic-chunker";
import { embedTexts } from "@/lib/embeddings/dense";
import { ensureCollection } from "@/lib/qdrant/collection";
import { upsertChunks, type ChunkPoint } from "@/lib/qdrant/upsert";
import { makeDeterministicId } from "@/lib/utils";
import type { Chunk, ChunkDraft } from "@/types/chunk";
import type { LessonFile } from "@/types/course";

export interface IngestionOptions {
  coursesRootDir: string;
  courseName: string;
  /** Optional cap on number of lessons processed, useful for smoke-testing. */
  lessonLimit?: number;
}

export interface IngestionSummary {
  courseSlug: string;
  totalLessons: number;
  totalChunks: number;
  skippedLessons: string[];
}

interface DraftWithMeta {
  draft: ChunkDraft;
  lesson: LessonFile;
  chunkIndex: number;
}

async function buildChunkDrafts(lesson: LessonFile): Promise<ChunkDraft[]> {
  const cues = await parseSubtitleFile(lesson.filePath);
  const sentences = buildSentences(cues);
  if (sentences.length === 0) return [];
  return semanticChunk(sentences, embedTexts);
}

function toChunk(item: DraftWithMeta, coursesRootDir: string): Chunk {
  const { draft, lesson, chunkIndex } = item;
  return {
    id: makeDeterministicId(lesson.courseSlug, lesson.module, lesson.lesson, String(chunkIndex)),
    text: draft.text,
    metadata: {
      course: lesson.course,
      courseSlug: lesson.courseSlug,
      module: lesson.module,
      moduleOrder: lesson.moduleOrder,
      lesson: lesson.lesson,
      lessonOrder: lesson.lessonOrder,
      chunkIndex,
      startMs: draft.startMs,
      endMs: draft.endMs,
      sourceFile: path.relative(coursesRootDir, lesson.filePath),
    },
  };
}

/**
 * Runs the full ingestion pipeline for one course: discover lessons, parse
 * subtitles, semantically chunk them, generate dense embeddings, and
 * upsert everything into Qdrant.
 */
export async function runIngestion(options: IngestionOptions): Promise<IngestionSummary> {
  const courseSlug = slugify(options.courseName);
  const allLessons = await discoverLessons(options.coursesRootDir, options.courseName);
  const lessons = options.lessonLimit ? allLessons.slice(0, options.lessonLimit) : allLessons;

  const draftsWithMeta: DraftWithMeta[] = [];
  const skippedLessons: string[] = [];

  for (const lesson of lessons) {
    const drafts = await buildChunkDrafts(lesson);
    if (drafts.length === 0) {
      skippedLessons.push(lesson.filePath);
      continue;
    }
    drafts.forEach((draft, chunkIndex) => draftsWithMeta.push({ draft, lesson, chunkIndex }));
  }

  if (draftsWithMeta.length === 0) {
    return { courseSlug, totalLessons: lessons.length, totalChunks: 0, skippedLessons };
  }

  const chunks = draftsWithMeta.map((item) => toChunk(item, options.coursesRootDir));
  const chunkTexts = chunks.map((chunk) => chunk.text);

  const denseVectors = await embedTexts(chunkTexts);

  const points: ChunkPoint[] = chunks.map((chunk, i) => ({
    chunk,
    denseVector: denseVectors[i],
  }));

  await ensureCollection();
  await upsertChunks(points);

  return {
    courseSlug,
    totalLessons: lessons.length,
    totalChunks: chunks.length,
    skippedLessons,
  };
}
