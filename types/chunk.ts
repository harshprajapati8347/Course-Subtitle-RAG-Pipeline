/** Metadata attached to every indexed chunk, used for citations at retrieval time. */
export interface ChunkMetadata {
  course: string;
  courseSlug: string;
  module: string;
  moduleOrder: number;
  lesson: string;
  lessonOrder: number;
  chunkIndex: number;
  startMs: number;
  endMs: number;
  sourceFile: string;
}

/** A chunk before its embeddings have been generated. */
export interface ChunkDraft {
  text: string;
  startMs: number;
  endMs: number;
}

/** A fully-formed chunk, ready to be embedded and upserted into Qdrant. */
export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}
