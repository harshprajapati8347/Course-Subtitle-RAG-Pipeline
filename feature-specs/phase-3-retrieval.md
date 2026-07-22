# Phase 3 — Retrieval

**Status:** Complete (smoke-tested against real OpenAI + Qdrant Cloud + Cohere)
**Deliverable:** Top relevant chunks.

## Summary

Implemented the retrieval half of the pipeline: query rewrite, multi-query
expansion, vector search, merge & deduplicate, and Cohere rerank. Verified
end-to-end with two real questions against the course data already indexed
in Qdrant from Phase 2 — see "Verification" below.

## Scope Decision: Dense-Only Retrieval (no sparse/BM25)

The architecture doc lists this phase's search step as "Hybrid Retrieval"
(dense + sparse), but Phase 2 removed sparse/BM25 vectors from the Qdrant
collection at your explicit request, and flagged that Phase 3's scope
needed re-confirming. You confirmed **dense-only retrieval** for this
phase. Accordingly:

- The Qdrant collection and its `dense`-only vector config are unchanged.
- The search step below is called "Dense Search", not "Hybrid Retrieval".
- True hybrid (dense + sparse) search is deferred and will be scoped
  explicitly if/when reintroduced.

## Files Created

### Types

- `types/retrieval.ts` — `RetrievedChunk` (id, text, score, metadata),
  `RetrievalOptions` (optional `courseSlug` filter, `topK`).

### Prompts

- `prompts/query-rewrite.prompt.ts` — `QUERY_REWRITE_SYSTEM_PROMPT`.
- `prompts/multi-query.prompt.ts` — `MULTI_QUERY_SYSTEM_PROMPT`.

### Retrieval

- `lib/retrieval/llm.ts` — `getChatModel()`, a lazily-created singleton
  `ChatOpenAI` (`gpt-5.5`), shared by query rewrite and multi-query
  expansion.
- `lib/retrieval/query-rewrite.ts` — `rewriteQuery()`. Uses
  `withStructuredOutput` (Zod schema) to turn a raw user question into one
  clear, standalone search query — fixes typos/grammar, expands vague
  pronouns, strips conversational filler.
- `lib/retrieval/multi-query.ts` — `expandQuery()`. Expands the rewritten
  query into 3 additional semantically diverse phrasings (also via
  `withStructuredOutput`), returned alongside the original for a total of
  4 query variants to search with.
- `lib/retrieval/dense-search.ts` — `denseSearch()`. Embeds a query
  string and runs Qdrant's `query()` against the named `dense` vector,
  with an optional `courseSlug` payload filter; maps `ScoredPoint`s back
  into `RetrievedChunk`s.
- `lib/retrieval/merge.ts` — `mergeAndDeduplicate()`. Flattens result sets
  from all query variants, dedupes by chunk id (keeping the highest score
  seen), sorted descending by score.
- `lib/retrieval/pipeline.ts` — `retrieveTopChunks()`. Orchestrates the
  full Phase 3 flow described below and returns the rewritten query, all
  expanded query variants, and the final reranked chunks.

### Reranker

- `lib/reranker/cohere.ts` — `rerankChunks()`. Uses `@langchain/cohere`'s
  `CohereRerank` (`rerank-v3.5`) to rerank merged candidates against the
  rewritten query, replacing each chunk's dense-similarity score with
  Cohere's relevance score and truncating to the final top-N.

### CLI

- `scripts/retrieve.ts` — `npm run retrieve -- "<question>" [courseSlug]`.
  Prints the rewritten query, all expanded variants, and the final top-N
  reranked chunks with scores, lesson/module, and a text preview.

## Files Modified

- `package.json` — added `"retrieve": "tsx scripts/retrieve.ts"` script.
- Deleted leftover `lib/retrieval/.gitkeep` and `lib/reranker/.gitkeep`
  now that both folders have real content (same pattern Phase 2 used for
  its populated folders).

## Pipeline Flow (`retrieveTopChunks`)

```text
question
  → rewriteQuery()                  (GPT-5.5, structured output → 1 clean query)
  → expandQuery()                   (GPT-5.5, structured output → +3 variants, 4 total)
  → denseSearch() per variant        (parallel; embedQuery + Qdrant query(), top 10 each)
  → mergeAndDeduplicate()           (flatten, dedupe by chunk id, keep max score)
  → rerankChunks()                  (Cohere rerank-v3.5 vs rewritten query, top 5)
  → { rewrittenQuery, expandedQueries, chunks }
```

## Verification

Ran `npm run retrieve -- "<question>"` twice against real OpenAI, Qdrant
Cloud, and Cohere APIs, using the course data already indexed in Qdrant:

1. A generic question ("What is this lesson about?") returned 5 chunks
   spanning several unrelated modules with low, closely-clustered rerank
   scores (0.05–0.16) — expected, since the question has no single strong
   match.
2. A specific, topical question ("difference between native apps and
   cross platform apps") returned 5 chunks with clearly differentiated
   rerank scores (0.83 down to 0.26), correctly ranking the most directly
   relevant chunk first.

Also confirmed:

- `tsc --noEmit`, `next lint`, and `next build` all pass with zero errors.
- Query rewrite and multi-query expansion produce sensible, on-topic
  output (verified via the CLI's printed rewritten/expanded queries).

## Manual Actions Required

None. All required API keys (`OPENAI_API_KEY`, `QDRANT_API_KEY`,
`COHERE_API_KEY`) were already present in `.env` from Phase 1 and used
directly for this phase's verification.

---

**Next phase (awaiting your explicit approval):** Phase 4 — Generation
(context builder, GPT prompt, citation generation, citation validation).
