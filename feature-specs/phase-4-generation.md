# Phase 4 — Generation

**Status:** Complete (smoke-tested against real OpenAI, Qdrant Cloud, and Cohere)
**Deliverable:** Grounded answers.

## Summary

Implemented the generation half of the pipeline: a numbered context
builder, a citation-instructed GPT prompt, and citation
extraction/resolution/validation. Verified end-to-end (Phase 3 retrieval →
Phase 4 generation) with a real question — see "Verification" below.

## Refactor: Shared Chat Model Moved to `lib/llm/`

Phase 3 put the shared `ChatOpenAI` singleton at `lib/retrieval/llm.ts`.
Generation also needs a chat model (for answer generation, alongside
retrieval's query rewrite/multi-query), so it was moved to a new,
model-agnostic `lib/llm/chat-model.ts`. This avoids `lib/generation`
depending on `lib/retrieval` just to get an LLM client, and keeps both
phases as siblings depending on shared infra rather than each other.

- **Moved:** `lib/retrieval/llm.ts` → `lib/llm/chat-model.ts` (same
  `getChatModel()` / `CHAT_MODEL` exports).
- Updated imports in `lib/retrieval/query-rewrite.ts` and
  `lib/retrieval/multi-query.ts`.

Also note: the chat model was already switched from `gpt-5.5` (the
architecture doc's placeholder name) to the real, callable
`gpt-4o-mini` — that edit was already in place in `lib/retrieval/llm.ts`
before this phase started, and was carried over as-is during the move.

## New Folder: `lib/generation/`

The architecture doc's suggested folder structure (Section 4) doesn't
list a folder for generation specifically. Since `lib/pipeline/` is
reserved for Phase 5's LangGraph orchestration (per the Phase 1 spec),
a new `lib/generation/` folder was added, following the same pattern as
`lib/retrieval/` and `lib/reranker/`.

## Files Created

### Types

- `types/generation.ts` — `Citation` (index, chunkId, metadata),
  `CitationValidationResult` (isValid, validIndexes, invalidIndexes),
  `GeneratedAnswer` (question, answer, citations, validation).

### Prompts

- `prompts/generation.prompt.ts` — `GENERATION_SYSTEM_PROMPT`. Instructs
  the model to answer only from the given context, cite every factual
  claim with `[n]` markers, and say so plainly if context is
  insufficient (no guessing).

### LLM (new shared location)

- `lib/llm/chat-model.ts` — `getChatModel()`, `CHAT_MODEL` (moved from
  `lib/retrieval/llm.ts`, see refactor note above).

### Generation

- `lib/generation/context-builder.ts` — `buildContext()`. Turns
  `RetrievedChunk[]` into a numbered context block (`[1]`, `[2]`, ...)
  with a header per source (course/module/lesson/timestamp range via the
  new `formatTimestamp()` util) followed by the chunk text; also returns
  a `sources: Citation[]` map from marker number → chunk metadata.
- `lib/generation/generate-answer.ts` — `generateAnswer()`. Sends the
  system prompt + `Context:\n...\n\nQuestion: ...` to the chat model and
  returns the raw answer text (with `[n]` markers still embedded).
- `lib/generation/citations.ts` — `extractCitationIndexes()` (regex-based
  `[n]` marker extraction), `validateCitations()` (flags any marker
  number not present in `sources` as a hallucinated/invalid citation),
  `resolveCitations()` (maps the markers actually used in the answer back
  to full `Citation` metadata).
- `lib/generation/pipeline.ts` — `generateGroundedAnswer()`. Orchestrates
  the full Phase 4 flow described below.

### Reusable utilities

- `lib/utils/time.ts` — `formatTimestamp()`. Formats milliseconds as
  `mm:ss`, or `h:mm:ss` past the 1-hour mark; added to the `lib/utils`
  barrel export.

### CLI

- `scripts/ask.ts` — `npm run ask -- "<question>" [courseSlug]`. Runs
  Phase 3 retrieval + Phase 4 generation end-to-end and prints the
  answer, citation-validation status, and resolved sources (with
  formatted timestamps).

## Files Modified

- `package.json` — added `"ask": "tsx scripts/ask.ts"` script.
- `lib/utils/index.ts` — added `export * from "./time"`.
- `lib/retrieval/query-rewrite.ts`, `lib/retrieval/multi-query.ts` —
  updated the `getChatModel` import path after the `lib/llm/` move.

## Pipeline Flow (`generateGroundedAnswer`)

```text
question, chunks (from Phase 3 retrieveTopChunks)
  → buildContext(chunks)             (chunks → numbered context block + sources[])
  → generateAnswer(question, contextText)   (chat model, cites [n] markers)
  → validateCitations(answer, sources)      (flags any out-of-range marker)
  → resolveCitations(answer, sources)       (marker → full Citation metadata)
  → { question, answer, citations, validation }
```

## Citation Validation Design (relevant for Phase 5)

`validateCitations()` only detects **out-of-range/hallucinated** marker
numbers (a marker like `[7]` when only 5 sources exist) — it does not
retry or fix anything itself; it just reports `isValid` plus which
indexes were valid/invalid. Per the architecture doc, **retrying on
invalid citations is explicitly Phase 5's job** (LangGraph orchestration
loop), so no retry logic was added here.

## Verification

Ran `npm run ask -- "What is the difference between native apps and cross platform apps?"`
against real OpenAI, Qdrant Cloud, and Cohere APIs (Phase 3 retrieval
feeding Phase 4 generation):

- Answer was accurate, grounded in the retrieved transcript chunks, and
  cited exactly 2 sources (`[1][2]`) inline.
- Citation validation reported `valid` (no hallucinated markers).
- Resolved citations correctly mapped back to real lesson names, modules,
  and human-readable timestamps (e.g. `what is mobile development
  (4:21-6:39)`).
- `tsc --noEmit`, `next lint`, and `next build` all pass with zero errors.

## Manual Actions Required

None. Existing `.env` keys were sufficient for this phase's
verification.

---

**Next phase (awaiting your explicit approval):** Phase 5 — LangGraph
(graph state, node implementations for guard/rewrite/expand/retrieve/
rerank/context/generate/validate, edges, and retry-on-invalid-citations
logic).
