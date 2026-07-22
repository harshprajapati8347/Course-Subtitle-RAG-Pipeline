# Phase 2 — Ingestion

**Status:** Complete (smoke-tested against real OpenAI + Qdrant Cloud)
**Deliverable:** Indexed course.

## Summary

Implemented the full ingestion pipeline: discover course folders, parse
`.srt`/`.vtt` subtitles, extract module/lesson metadata, semantically chunk
transcripts, generate dense vectors (OpenAI), create the Qdrant collection,
and upsert chunks. Verified end-to-end on 1 real lesson — see
"Verification" below.

Qdrant stores **dense embeddings only** in this phase. An earlier draft of
this phase also generated custom BM25 sparse vectors for hybrid search, but
that was removed at your request — see "Removed: custom BM25" below.

## Files Created

### Types

- `types/subtitle.ts` — `SubtitleCue`, `Sentence`.
- `types/course.ts` — `LessonFile` (discovered lesson + parsed metadata).
- `types/chunk.ts` — `ChunkDraft`, `Chunk`, `ChunkMetadata` (citation fields).

### Parsing

- `lib/parser/subtitle-parser.ts` — `parseSubtitleFile()`. Uses the
  `subtitle` package's `parseSync`, which auto-detects SRT vs WebVTT, so one
  function handles both formats.
- `lib/parser/metadata.ts` — `parseModuleFolderName()`,
  `parseLessonFolderName()`, `slugify()`. Extracts an order number + clean
  title from real (inconsistently named) folder names like `module 1 hc`,
  `01_topic_epm`, `3.Configure...`, `chapter-1_epm`, falling back to
  discovery order when no leading number is found.

### Ingestion / Discovery

- `lib/ingestion/discover.ts` — `discoverLessons()`, `listAvailableCourses()`.
  Walks `courses/<course>/<module>/<lesson>/`, picks the `.srt` file if
  present (else `.vtt`), skips lesson folders with no subtitle file.
- `lib/ingestion/pipeline.ts` — `runIngestion()`. Orchestrates the whole
  flow described below and returns a summary (lessons scanned, chunks
  indexed, skipped lessons).

### Chunking

- `lib/chunking/sentence-splitter.ts` — `buildSentences()`. Subtitle cues
  rarely align with sentence boundaries, so cues are flattened into
  timestamped words (interpolating a timestamp per word across each cue's
  duration) and regrouped on `.`/`?`/`!`.
- `lib/chunking/semantic-chunker.ts` — `semanticChunk()`. Real semantic
  chunking: embeds every sentence, computes cosine distance between
  consecutive sentence embeddings, and treats large distance jumps (95th
  percentile by default) as topic-shift breakpoints. Small chunks are
  merged forward; a `maxChunkChars` cap forces a break regardless of
  semantic distance to avoid oversized chunks.

### Embeddings

- `lib/embeddings/dense.ts` — `embedTexts()`, `embedQuery()`, using
  `@langchain/openai`'s `OpenAIEmbeddings` (`text-embedding-3-small`,
  1536 dims). Also used internally by the chunker for sentence embeddings.

### Qdrant

- `lib/qdrant/client.ts` — `getQdrantClient()`, a lazily-created singleton.
- `lib/qdrant/collection.ts` — `ensureCollection()`. Creates
  `advanced_rag_chunks` (one collection for all courses; `courseSlug` is a
  payload field for filtering) with a single named dense vector (`dense`,
  1536, Cosine) if it doesn't already exist.
- `lib/qdrant/upsert.ts` — `upsertChunks()`. Batches upserts (100
  points/batch) with the chunk text + all metadata stored in the payload.

### Reusable utilities

- `lib/utils/vector-math.ts` — `cosineSimilarity()`, `percentile()` (used by
  the semantic chunker).
- `lib/utils/id.ts` — `makeDeterministicId()`. Hashes
  `courseSlug::module::lesson::chunkIndex` into a UUID-shaped string, so
  re-running ingestion overwrites the same points instead of duplicating
  them.
- `lib/utils/cn.ts` — unchanged shadcn `cn()` helper, moved here.
- `lib/utils/index.ts` — barrel export (`@/lib/utils` still resolves the
  same as before for existing component imports).

### CLI

- `scripts/ingest.ts` — `npm run ingest -- "<course name>" [lessonLimit]`.
  Defaults to the first course folder found under `courses/` if none is
  given. Prints a summary (lessons scanned / chunks indexed / skipped).

## Files Modified

- `package.json` — added `"ingest": "tsx scripts/ingest.ts"` script; added
  `dotenv` (direct dependency, only used by the standalone CLI script to
  load `.env` — Next.js itself already auto-loads it); removed `fastembed`
  (it was never actually used for BM25 — see below — and is not used for
  anything else either).
- `lib/utils.ts` → converted to `lib/utils/` folder (`cn.ts`,
  `vector-math.ts`, `id.ts`, `index.ts`) to match the architecture's
  Section 4 folder structure. No import paths needed to change since
  `@/lib/utils` resolves to the folder's `index.ts`.

## Removed: custom BM25 sparse vectors

An earlier version of this phase implemented a custom Okapi BM25
sparse-vector generator in TypeScript (the `fastembed` npm package only
ships neural SPLADE models, not real BM25, so it couldn't be used as
originally planned). Per your request, this has been **fully removed**:

- Deleted `lib/embeddings/bm25.ts` (tokenizer, vocabulary/IDF builder,
  BM25 vectorizer) and `lib/embeddings/bm25-store.ts` (vocabulary
  persistence).
- Deleted `types/vector.ts` (`SparseVector` type — no longer used anywhere).
- Deleted the generated `data/bm25/*.json` vocabulary files and the `data/`
  directory.
- `lib/qdrant/collection.ts` — `ensureCollection()` no longer configures a
  `sparse_vectors` field; `SPARSE_VECTOR_NAME` export removed.
- `lib/qdrant/upsert.ts` — `ChunkPoint` no longer has a `sparseVector`
  field; points are upserted with only the named `dense` vector.
- `lib/ingestion/pipeline.ts` — no longer builds a BM25 index or generates
  sparse vectors; only calls `embedTexts()` for dense embeddings.
- The **existing Qdrant collection was deleted and recreated** with a
  dense-only vector config, since it had already been created (during
  Phase 2's original smoke test) with a `sparse` vector field that no
  longer matches the code.
- `package.json` — removed the `fastembed` dependency entirely.

Hybrid search is deferred; if/when it's reintroduced, it will be scoped
and approved explicitly rather than assumed.

## Pipeline Flow (`runIngestion`)

```text
discoverLessons(courses/<course>)
  → for each lesson:
      parseSubtitleFile()        (.srt/.vtt → cues)
      buildSentences()           (cues → timestamped sentences)
      semanticChunk()            (sentences → ChunkDraft[], embeds sentences internally)
  → flatten all ChunkDrafts across all lessons
  → embedTexts(all chunk texts)          (batched OpenAI dense embeddings)
  → ensureCollection()                   (create Qdrant collection if missing)
  → upsertChunks()                       (batched upsert, deterministic IDs)
```

## Verification

Ran `npm run ingest -- "class-subtitle" 1` (real OpenAI + Qdrant Cloud,
limited to 1 lesson as a smoke test), after the BM25 removal:

- 1 lesson scanned → 5 semantically coherent chunks indexed.
- Confirmed in Qdrant: collection `advanced_rag_chunks` recreated with only
  a `dense` (1536, Cosine) named vector — `sparse_vectors` is `undefined`
  on the collection config, and no sparse data is stored on points.
- `tsc --noEmit`, `next lint`, and `next build` all pass with zero errors.

The 5 test chunks remain in Qdrant. This is safe — ingestion is
idempotent (deterministic point IDs), so re-running ingestion on the full
course will not duplicate them.

## Manual Actions Required / Recommended Next Step

**The full course has not been ingested yet** — only 1 of many lessons
was processed, as a correctness check. To index an entire course, run:

```bash
npm run ingest -- "<course folder name>"
```

This makes one OpenAI embeddings call per lesson (for semantic chunking)
plus a final batched call for all chunk embeddings — real API usage
against your OpenAI key. Let me know if you'd like this run now, or if
you'd rather run it yourself and report back before Phase 3 starts.

---

**Next phase (awaiting your explicit confirmation):** Phase 3 — Retrieval
(query rewrite, multi-query expansion, hybrid search, merge & deduplicate,
rerank). Note: the architecture doc's Phase 3 scope includes "Hybrid
search" (dense + sparse); since sparse vectors were just removed, Phase 3
scope should be re-confirmed with you before implementation starts.
