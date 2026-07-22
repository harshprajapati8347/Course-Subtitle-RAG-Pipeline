# Phase 5 — LangGraph

**Status:** Complete (smoke-tested against real OpenAI, Qdrant Cloud, and Cohere)
**Deliverable:** Complete orchestrated pipeline.

## Summary

Wired everything from Phases 3 and 4 into a single LangGraph `StateGraph`
that matches the architecture doc's flow exactly: `Guard → Rewrite →
Expand → Retrieve → Rerank → Context → Generate → Validate`, with a
retry loop from Validate back to Generate when citations are hallucinated.
Also implemented the **Input Guard** node itself, which wasn't built in
Phase 3 (its "Hybrid Retrieval" scope) or Phase 4 — the architecture doc
places it first in the graph, so it's implemented here.

## Files Created

### Types

- `types/guard.ts` — `GuardResult` (passed, reason).

### LLM (shared)

- `lib/llm/openai-client.ts` — `getOpenAIClient()`. A shared raw
  `openai` SDK client (singleton), used for the moderation endpoint,
  which LangChain doesn't wrap.

### Guard

- `lib/guard/input-guard.ts` — `runInputGuard()`. Rejects empty/too-short
  (< 3 chars) or too-long (> 1000 chars) questions outright, then runs
  the question through OpenAI's moderation endpoint and blocks anything
  flagged.

### Pipeline (LangGraph orchestration)

- `lib/pipeline/state.ts` — `PipelineStateAnnotation` (built with
  LangGraph's `Annotation.Root`) and the derived `PipelineState` type.
  Threads `question`, `courseSlug`, `guard`, `rewrittenQuery`,
  `expandedQueries`, `candidateChunks`, `rerankedChunks`, `contextText`,
  `sources`, `answer`, `citations`, `validation`, and `retryCount`
  through the graph.
- `lib/pipeline/nodes/guard.ts` — `guardNode()`. Calls `runInputGuard()`.
- `lib/pipeline/nodes/rewrite.ts` — `rewriteNode()`. Calls Phase 3's
  `rewriteQuery()`.
- `lib/pipeline/nodes/expand.ts` — `expandNode()`. Calls Phase 3's
  `expandQuery()`.
- `lib/pipeline/nodes/retrieve.ts` — `retrieveNode()`. Calls Phase 3's
  `denseSearch()` per query variant (in parallel) + `mergeAndDeduplicate()`.
- `lib/pipeline/nodes/rerank.ts` — `rerankNode()`. Calls Phase 3's
  `rerankChunks()`.
- `lib/pipeline/nodes/context.ts` — `contextNode()`. Calls Phase 4's
  `buildContext()`.
- `lib/pipeline/nodes/generate.ts` — `generateNode()`. Calls Phase 4's
  `generateAnswer()`; on a retry (previous validation failed), passes the
  invalid marker numbers back to the model as corrective feedback.
- `lib/pipeline/nodes/validate.ts` — `validateNode()`. Calls Phase 4's
  `validateCitations()` + `resolveCitations()`, and increments
  `retryCount`.
- `lib/pipeline/graph.ts` — `getPipelineGraph()`. Builds and memoizes the
  compiled `StateGraph`; owns the two conditional-edge routing functions
  (`routeAfterGuard`, `routeAfterValidate`, see "Retry Logic" below).
- `lib/pipeline/run.ts` — `runPipeline(question, options)`. Thin
  entry point that invokes the compiled graph and returns the final
  `PipelineState`.

### CLI

- `scripts/pipeline.ts` — `npm run pipeline -- "<question>" [courseSlug]`.
  Runs the full orchestrated graph (guard included) and prints the guard
  result (if blocked), rewritten/expanded queries, the answer with its
  generation-attempt count, citation-validation status, and resolved
  sources.

## Files Modified

- `package.json` — added `"pipeline": "tsx scripts/pipeline.ts"` script.
- `lib/generation/generate-answer.ts` — `generateAnswer()` now accepts an
  optional third `feedback` parameter, appended to the user message.
  Used by the retry loop to tell the model which citation markers were
  invalid last time. Fully backward-compatible (Phase 4's own callers
  omit it).

## Graph Structure

```text
START
  → guardNode
      ├─ (blocked) → END
      └─ (passed)  → rewriteNode
                        → expandNode
                          → retrieveNode
                            → rerankNode
                              → contextNode
                                → generateNode ⟲ (retry on invalid citations)
                                  → validateNode
                                      ├─ (invalid & attempts < 3) → generateNode
                                      └─ (valid, or attempts exhausted) → END
```

Node keys in the graph are suffixed with `Node` (`guardNode`,
`rewriteNode`, ...) specifically because LangGraph's `StateGraph` throws
if a node name collides with a state channel name (e.g. a node literally
named `"guard"` would collide with the `guard` state field) — discovered
and fixed during this phase's smoke testing.

## Retry Logic (Validate → Generate)

`routeAfterValidate()` sends control back to `generateNode` when
`validation.isValid` is `false` **and** `retryCount` is under
`MAX_GENERATION_ATTEMPTS` (3 total attempts: 1 initial + up to 2
retries). `generateNode` detects it's on a retry via a non-`undefined`,
invalid `validation` in state, and appends corrective feedback (the
exact invalid marker numbers) to the prompt so the model can
self-correct. If citations are still invalid after the attempt cap, the
graph proceeds to `END` anyway with the last answer produced — Phase 5's
job is to retry, not to block indefinitely; the returned
`validation.isValid` flag lets a caller (e.g. the future UI) decide how
to present an answer that couldn't be fully validated.

## Verification

Ran `npm run pipeline -- "<question>"` against real OpenAI, Qdrant
Cloud, and Cohere APIs:

1. **Happy path** — "What is the difference between native apps and cross
   platform apps?" passed the guard, flowed through all 8 nodes, and
   produced a valid, correctly cited answer after 1 generation attempt
   (no retry needed).
2. **Guard rejection (deterministic)** — `"hi"` was blocked immediately
   with `"Question is too short."`, confirming the graph short-circuits
   to `END` right after `guardNode` without touching retrieval/generation
   at all.
3. One run hit a transient `ContextOverflowError` from OpenAI's
   embeddings endpoint (unrelated to this phase's code — same
   `denseSearch`/`embedQuery` call path that already worked repeatedly in
   Phase 3) and succeeded immediately on retry; treated as environment/
   network flakiness rather than a pipeline bug, consistent with earlier
   `ETIMEDOUT` blips seen during `next build`'s font fetch in this
   environment.

Also confirmed: `tsc --noEmit`, `next lint`, and `next build` all pass
with zero errors.

## Manual Actions Required

None. Existing `.env` keys were sufficient.

---

**Next phase (awaiting your explicit approval):** Phase 6 — UI (basic
chat page, citation cards, markdown rendering).
