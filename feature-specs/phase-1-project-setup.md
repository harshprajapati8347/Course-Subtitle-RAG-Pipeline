# Phase 1 — Project Setup

**Status:** Complete
**Deliverable:** Empty project with dependencies.

## Summary

Bootstrapped the Next.js 15 + TypeScript application that will host the
Advanced RAG pipeline, configured Tailwind CSS + shadcn/ui, installed all
core AI/vector-search dependencies, and laid out the folder structure defined
in the architecture doc (Section 4). No business logic was implemented in
this phase — only scaffolding, tooling, and configuration.

## Stack Versions Installed

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 15.5.21 |
| UI | React | 19.2.4 |
| Styling | `tailwindcss` | v4 (postcss plugin) |
| Components | `shadcn/ui` | base-nova style, neutral base color |
| AI Framework | `langchain` | 1.5.x |
| Workflow | `@langchain/langgraph` | 1.4.x |
| LLM/Embeddings client | `@langchain/openai`, `openai` | latest |
| Vector DB client | `@qdrant/js-client-rest`, `@langchain/qdrant` | latest |
| Reranker | `cohere-ai`, `@langchain/cohere` | latest |
| Subtitle parsing | `subtitle` | 4.x |
| Validation | `zod` | v4 |
| Script runner | `tsx` (dev dependency) | latest |

## Folder Structure Created

Matches Section 4 of the architecture doc exactly:

```text
rag-pipeline/
├── app/                 (Next.js App Router — from create-next-app)
├── courses/             (pre-existing course subtitle files)
├── lib/
│   ├── ingestion/       (empty — Phase 2)
│   ├── parser/          (empty — Phase 2)
│   ├── chunking/        (empty — Phase 2)
│   ├── embeddings/      (empty — Phase 2)
│   ├── retrieval/       (empty — Phase 3)
│   ├── reranker/        (empty — Phase 3)
│   ├── pipeline/        (empty — Phase 5)
│   ├── qdrant/          (empty — Phase 2)
│   ├── utils.ts         (shadcn `cn()` helper)
│   └── env.ts           (Zod-validated environment config)
├── prompts/             (empty — Phase 4)
├── scripts/             (empty — Phase 2)
├── eval/                (empty — future)
├── docs/                (empty — future)
├── types/               (empty — populated as phases progress)
├── components/ui/       (shadcn primitives: button, card, input,
│                          scroll-area, badge, separator)
├── feature-specs/       (this documentation)
└── .cursor/mcp.json     (Context7 docs MCP server)
```

Each currently-unused folder contains a `.gitkeep` placeholder so the
structure is tracked by git ahead of the phases that populate it.

## Files Created

- `.env.example` — template listing the 4 required env vars (no secrets).
- `lib/env.ts` — reusable, Zod-validated accessor (`getEnv()`) for
  `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `COHERE_API_KEY`. Throws
  a descriptive error if anything is missing/invalid; used by future
  ingestion/retrieval modules instead of reading `process.env` directly.
- `.cursor/mcp.json` — registers the Context7 documentation MCP server so
  Cursor can look up up-to-date docs for LangChain.js, LangGraph, Qdrant,
  the OpenAI SDK, and Cohere while implementing later phases.
- `lib/{ingestion,parser,chunking,embeddings,retrieval,reranker,pipeline,qdrant}/.gitkeep`
- `prompts/.gitkeep`, `scripts/.gitkeep`, `eval/.gitkeep`, `docs/.gitkeep`, `types/.gitkeep`
- `feature-specs/phase-1-project-setup.md` — this file.
- Standard Next.js scaffold: `app/layout.tsx`, `app/page.tsx`,
  `app/globals.css`, `next.config.ts`, `tsconfig.json`,
  `eslint.config.mjs`, `postcss.config.mjs`, `components.json`,
  `lib/utils.ts`, `components/ui/*.tsx`, `public/*`.

## Files Modified

- `package.json` — renamed to `advanced-rag-pipeline`, dependencies above added.
- `next.config.ts` — set `outputFileTracingRoot` to silence a multi-lockfile
  warning caused by an unrelated lockfile higher up in the filesystem.
- `eslint.config.mjs` — rewritten to use `FlatCompat` so `eslint-config-next`
  v15 (matching Next 15) works correctly with ESLint 9's flat config format.
- `.gitignore`, `.env` — untouched; `.env*` was already ignored, and the
  existing `.env` (with real keys) was left as-is.

## What Was Implemented

1. Scaffolded Next.js 15 (App Router, TypeScript, ESLint) via
   `create-next-app`, generated into a temp folder and merged into the repo
   root to avoid clobbering existing files (`courses/`, `.env`, the
   architecture doc, `feature-specs/`).
2. Pinned `next` to `15.5.21` (the scaffolder defaulted to Next 16, but the
   architecture doc specifies Next.js 15).
3. Initialized shadcn/ui (`base-nova` style, `neutral` base color, CSS
   variables) and added baseline UI primitives (`button`, `card`, `input`,
   `scroll-area`, `badge`, `separator`) that the Phase 6 chat UI will reuse.
4. Installed all Phase-1-scope libraries: LangChain.js, LangGraph, the
   OpenAI SDK, the Qdrant JS client, Cohere SDK, the `subtitle` parser, and
   Zod.
5. Created the full folder structure from Section 4 of the architecture doc.
6. Added a small, reusable `lib/env.ts` utility for typed/validated env var
   access (no logic beyond configuration — actual usage begins in Phase 2).
7. Verified the project builds cleanly (`next build`), type-checks
   (`tsc --noEmit`), and lints (`next lint`) with zero errors/warnings.
8. Registered a Context7 MCP server in `.cursor/mcp.json` as the practical
   interpretation of "install skills/MCP servers" for the specified
   libraries — it gives the agent live documentation lookup for
   LangChain.js, LangGraph, Qdrant, the OpenAI SDK, and Cohere in later
   phases (no dedicated official MCP server exists for these individually).

## Manual Actions Required

1. **API keys are already present** in `.env` at the project root
   (`OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `COHERE_API_KEY`) — no
   action needed. `.env.example` was added as a safe, secret-free reference.
2. **Qdrant** is already configured as Qdrant Cloud (URL present in `.env`)
   — no local Docker setup needed unless you prefer self-hosting.
3. **Course content** already exists under `courses/class-subtitle/` with
   modules 1–17 — ready for Phase 2 ingestion.
4. **MCP server**: Cursor may need a reload/"Refresh" of MCP servers
   (Settings → MCP) to pick up the newly added `.cursor/mcp.json`
   (Context7). This is optional — it only helps the agent fetch live docs.
5. No other manual steps are required to proceed to Phase 2.

---

**Next phase (awaiting approval):** Phase 2 — Ingestion (discover course
folders, parse `.srt`/`.vtt`, extract metadata, semantic chunking, generate
dense vectors, create the Qdrant collection, and upsert chunks).
