# Course Subtitle RAG Pipeline

An **Advanced Retrieval-Augmented Generation (RAG)** system that answers questions from Udemy-style course subtitle files (`.srt` / `.vtt`) with grounded, cited answers — complete with lesson names, module names, and timestamp ranges for every claim.

Ask a question about a course you've taken notes-worth of subtitles for, and get an answer that's backed by `[1]`, `[2]`-style citations you can trace back to the exact lesson and timestamp it came from.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Indexing a Course](#indexing-a-course)
- [Usage](#usage)
- [Scripts](#scripts)
- [Implementation Phases](#implementation-phases)
- [Scope](#scope)

## Overview

This project ingests course subtitle files, chunks them semantically, embeds and stores them in a vector database, and answers natural-language questions about the course content through an orchestrated retrieval + generation pipeline:

1. **Ingestion** — discover course/module/lesson folders, parse `.srt`/`.vtt` subtitles, extract metadata, semantically chunk transcripts, embed, and upsert into Qdrant.
2. **Retrieval** — rewrite the user's question, expand it into multiple query variants, run dense vector search for each, merge/deduplicate, and rerank with Cohere.
3. **Generation** — build a numbered context block from the top chunks, prompt GPT to answer with inline `[n]` citations, and validate that every citation actually maps to a real source (retrying on hallucinated citations).
4. **Orchestration** — the entire retrieval + generation flow (plus an input guard) runs as a single LangGraph state graph.
5. **UI** — a minimal chat interface renders markdown answers with citation cards underneath.

## Architecture

```text
Course Folder
    │
    ▼
Discovery
    ▼
Subtitle Parser
    ▼
Metadata Extraction
    ▼
Semantic Chunking
    ▼
Embeddings
    ▼
Dense Vectors
    ▼
Qdrant

================================

User Question
    ▼
Input Guard
    ▼
Query Rewrite
    ▼
Multi Query Expansion
    ▼
Dense Retrieval
    ▼
Cohere Reranker
    ▼
Context Builder
    ▼
GPT Generation
    ▼
Citation Validation
    ▼
Final Response
```

### LangGraph Orchestration

The retrieval + generation flow above is wired together as a single `StateGraph`, with a retry loop that sends control back to the `generate` node whenever a citation can't be validated (up to 3 total attempts):

```text
START
  → guard
      ├─ (blocked) → END
      └─ (passed)  → rewrite
                        → expand
                          → retrieve
                            → rerank
                              → context
                                → generate ⟲ (retry on invalid citations)
                                  → validate
                                      ├─ (invalid & attempts < 3) → generate
                                      └─ (valid, or attempts exhausted) → END
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| AI Framework | LangChain.js |
| Orchestration | LangGraph |
| LLM | OpenAI GPT (via `@langchain/openai`) |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Vector DB | Qdrant |
| Reranker | Cohere Rerank (`rerank-v3.5`) |
| Subtitle Parsing | `subtitle` (npm) |
| Validation | Zod |
| Markdown Rendering | `react-markdown` + Tailwind Typography |

## Project Structure

```text
rag-pipeline/
├── app/
│   ├── api/ask/route.ts       # POST /api/ask — runs the LangGraph pipeline
│   ├── page.tsx                # Chat UI (client component)
│   └── layout.tsx
├── components/
│   ├── chat/                   # ChatInput, ChatMessageBubble, CitationCard
│   └── ui/                     # shadcn/ui primitives
├── courses/
│   └── <course-name>/<module>/<lesson>/*.srt|*.vtt
├── lib/
│   ├── parser/                 # .srt/.vtt parsing + module/lesson metadata
│   ├── chunking/                # sentence splitting + semantic chunking
│   ├── embeddings/               # OpenAI dense embeddings
│   ├── ingestion/                 # course discovery + ingestion pipeline
│   ├── qdrant/                    # Qdrant client, collection, upsert
│   ├── retrieval/                  # query rewrite, multi-query, dense search, merge
│   ├── reranker/                    # Cohere rerank
│   ├── generation/                   # context builder, answer generation, citations
│   ├── guard/                         # input guard (length + moderation)
│   ├── llm/                            # shared chat model / OpenAI client singletons
│   ├── pipeline/                        # LangGraph state, nodes, graph, entry point
│   └── utils/                            # cn, vector-math, id, time helpers
├── prompts/                     # system prompts (rewrite, multi-query, generation)
├── scripts/                     # CLI entry points (ingest, retrieve, ask, pipeline)
├── types/                       # shared TypeScript types
├── feature-specs/               # architecture doc + per-phase implementation logs
└── eval/, docs/                 # reserved for future use
```

## Getting Started

### Prerequisites

- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Cohere API key](https://dashboard.cohere.com/api-keys)
- A [Qdrant](https://qdrant.tech/) instance (Qdrant Cloud or self-hosted via Docker)

### Installation

```bash
npm install
```

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
COHERE_API_KEY=
```

Environment variables are validated at runtime via `lib/env.ts` (Zod) — the app will throw a descriptive error if any are missing or malformed.

## Indexing a Course

1. Add your course subtitle files under `courses/`, following this layout:

```text
courses/
  <course name>/
    <module 1>/
      <lesson 1>/
        lesson.srt   (or .vtt)
      <lesson 2>/
        ...
    <module 2>/
      ...
```

2. Run the ingestion pipeline:

```bash
npm run ingest -- "<course folder name>"
```

This will:

- Discover every module/lesson folder under `courses/<course name>/`.
- Parse each `.srt`/`.vtt` file (falls back to `.vtt` if no `.srt` is present).
- Split subtitle cues into sentences and semantically chunk each lesson's transcript.
- Generate OpenAI embeddings for every chunk.
- Create the Qdrant collection (if it doesn't already exist) and upsert all chunks.

Ingestion is **idempotent** — chunk IDs are deterministically derived from `course + module + lesson + chunk index`, so re-running ingestion on the same course overwrites existing points instead of duplicating them.

Optionally pass a second argument to limit how many lessons are processed (useful for a smoke test before indexing an entire course):

```bash
npm run ingest -- "<course folder name>" 1
```

## Usage

### Chat UI

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and ask a question about your indexed course. Answers are rendered as markdown with inline `[n]` citation markers, and a numbered list of citation cards (lesson, module, and timestamp range) appears below each answer.

### Command Line

You can also exercise each stage of the pipeline directly from the CLI:

```bash
# Full retrieval + generation + LangGraph orchestration
npm run pipeline -- "What is the difference between native apps and cross platform apps?"

# Generation only (retrieval + citation-grounded answer, no graph/retry logic)
npm run ask -- "What is the difference between native apps and cross platform apps?"

# Retrieval only (rewritten query, expanded variants, reranked chunks)
npm run retrieve -- "What is the difference between native apps and cross platform apps?"
```

All three accept an optional second argument to filter by `courseSlug`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run ingest -- "<course>" [limit]` | Parse, chunk, embed, and upsert a course into Qdrant |
| `npm run retrieve -- "<question>" [courseSlug]` | Run query rewrite → expansion → dense search → rerank, print results |
| `npm run ask -- "<question>" [courseSlug]` | Run retrieval + generation, print the cited answer |
| `npm run pipeline -- "<question>" [courseSlug]` | Run the full LangGraph pipeline (guard included) |

## Implementation Phases

This project was built incrementally, one phase at a time, following [`feature-specs/project-architecture.md`](feature-specs/project-architecture.md). Each phase's implementation is documented in detail (files created/modified, design decisions, verification steps, manual actions) under `feature-specs/`:

| Phase | Deliverable | Doc |
|---|---|---|
| 1 — Project Setup | Empty project with dependencies | [`phase-1-project-setup.md`](feature-specs/phase-1-project-setup.md) |
| 2 — Ingestion | Fully indexed course | [`phase-2-ingestion.md`](feature-specs/phase-2-ingestion.md) |
| 3 — Retrieval | Top relevant chunks | [`phase-3-retrieval.md`](feature-specs/phase-3-retrieval.md) |
| 4 — Generation | Grounded, cited answers | [`phase-4-generation.md`](feature-specs/phase-4-generation.md) |
| 5 — LangGraph | Complete orchestrated pipeline | [`phase-5-langgraph.md`](feature-specs/phase-5-langgraph.md) |
| 6 — UI | Working chat demo | [`phase-6-ui.md`](feature-specs/phase-6-ui.md) |

## Scope

### Included (Phase 1–6)

- `.srt` / `.vtt` subtitle parsing
- Module/lesson metadata extraction
- Semantic chunking (embedding-distance breakpoints)
- OpenAI dense embeddings
- Qdrant vector storage
- Query rewrite + multi-query expansion
- Dense retrieval, merge & deduplicate
- Cohere reranking
- GPT generation with inline citations
- Citation validation with automatic retry
- LangGraph orchestration (with input guard)
- Basic chat UI with markdown + citation cards

### Deferred / Future Improvements

- Hybrid (dense + sparse/BM25) retrieval
- BullMQ background workers
- Redis caching
- File upload UI
- Authentication
- Streaming responses
- Chat history persistence
- Analytics & evaluation harness
- LangSmith tracing
- PostgreSQL
- Production deployment hardening

See [`feature-specs/project-architecture.md`](feature-specs/project-architecture.md) for the full original plan.
