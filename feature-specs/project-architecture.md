# Advanced RAG Pipeline Architecture

> **Project Goal**
>
> Build an Advanced Retrieval-Augmented Generation (RAG) system capable
> of answering questions from Udemy course subtitle files (`.srt` and `.vtt` files) with grounded answers, lesson names, timestamps, and source citations.

---

# 1. Scope (Phase 1)

This implementation intentionally focuses on the **core Advanced RAG
pipeline** rather than production infrastructure.

### Included

- `.srt` and `.vtt` files parsing
- Metadata extraction
- Semantic chunking
- OpenAI embeddings
- Qdrant vector database
- Query Rewrite
- Multi Query Expansion
- Cohere Reranker
- GPT-5.5 Generation
- Citation Validation
- LangGraph orchestration
- Basic chat interface



### Deferred

- BullMQ
- Redis cache
- Upload UI
- Authentication
- Streaming
- Analytics
- LangSmith
- PostgreSQL
- Background workers

---



# 2. High-Level Architecture

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
Multi Query
    ▼
Hybrid Retrieval
    ▼
Reranker
    ▼
Context Builder
    ▼
GPT-5.5
    ▼
Citation Validation
    ▼
Final Response
```

---



# 3. Tech Stack

  Layer             Technology

---

  Framework         Next.js 15
  Language          TypeScript
  AI Framework      LangChain.js
  Workflow          LangGraph
  LLM               GPT-5.5
  Embeddings        text-embedding-3-small
  Vector DB         Qdrant
  Reranker          Cohere Rerank
  Dense Search      OpenAI Rerank
  Subtitle Parser   subtitle (npm)
  Validation        Zod
  UI                shadcn/ui + Tailwind

---



# 4. Suggested Folder Structure

```text
advanced-rag/
├── app/
├── courses/
├── lib/
│   ├── ingestion/
│   ├── parser/
│   ├── chunking/
│   ├── embeddings/
│   ├── retrieval/
│   ├── reranker/
│   ├── pipeline/
│   ├── qdrant/
│   └── utils/
├── prompts/
├── scripts/
├── eval/
├── docs/
└── types/
```

---



# 5. Pipeline



## Ingestion

1. Discover course folders
2. Parse subtitle files
3. Extract module & lesson metadata
4. Semantic chunking
5. Generate embeddings
6. Generate dense vectors
7. Store in Qdrant



## Retrieval

1. Input Guard
2. Query Rewrite
3. Multi Query Expansion
4. Hybrid Retrieval
5. Reranker
6. Context Builder
7. GPT Generation
8. Citation Validation
9. Return answer

---



# 6. LangGraph Flow

```text
START
 ↓
Guard
 ↓
Rewrite
 ↓
Expand
 ↓
Retrieve
 ↓
Rerank
 ↓
Context
 ↓
Generate
 ↓
Validate
 ↓
END
```

---



# 7. Implementation Phases (Cursor)

For Each Phases - Create .md file inside feature-specs for each phases seperately after executing, to document everything that has been configured. It will be used as context for next phases.

## Phase 1 --- Project Setup

- Initialize Next.js + TypeScript
- Configure Tailwind & shadcn/ui
- Install LangChain, LangGraph, Qdrant, OpenAI SDK
- Install skills/MCP servers for LangChain.js, LangGraph, Qdrant, OpenAI SDK, Cohere
- Create project folder structure
- Configure environment variables

**Deliverable:** Empty project with dependencies.

---



## Phase 2 --- Ingestion

- Discover course folders
- Parse .srt and .vtt files
- Extract metadata
- Semantic chunking
- Generate embeddings
- Generate dense vectors
- Create Qdrant collection
- Upsert chunks

**Deliverable:** Fully indexed course ready for the retrieval pipeline.

---



## Phase 3 --- Retrieval

- Query rewrite
- Multi-query expansion
- Hybrid search
- Merge & deduplicate
- Rerank

**Deliverable:** Top relevant chunks.

---



## Phase 4 --- Generation

- Context builder
- GPT prompt
- Citation generation
- Citation validation

**Deliverable:** Grounded answers.

---



## Phase 5 --- LangGraph

- Create graph state
- Implement nodes
- Connect edges
- Retry invalid citations

**Deliverable:** Complete orchestrated pipeline.

---



## Phase 6 --- UI

- Basic chat page
- Citation cards
- Markdown rendering

**Deliverable:** Working demo.

---



# 8. Manual Setup (Not for Cursor)

Perform these once:

1. Create OpenAI API Key.
2. Create Cohere API Key.
3. Install and run Qdrant (Docker or Cloud).
4. Obtain Qdrant URL/API key.
5. Create `.env.local`:

```env
OPENAI_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
COHERE_API_KEY=
```

1. Add your course under:

```text
courses/
   Course Name/
      module 1/
      module 2/
```

1. Run ingestion once before asking questions.

---



# 9. Future Improvements

- BullMQ
- Redis
- Background ingestion
- Upload API
- Streaming
- Chat history
- Evaluation
- LangSmith
- PostgreSQL
- Production deployment

---



# Cursor Execution Prompt

Copy this repository into Cursor and use the following instruction:

```text
You are an expert TypeScript, Next.js, LangChain, LangGraph and RAG engineer.

Read this entire document before making any changes.

Implement ONLY ONE PHASE AT A TIME.

Rules:

- Never skip phases.
- Never implement future phases early.
- Complete the current phase before moving on.
- Keep the code modular.
- Use TypeScript everywhere.
- Follow clean architecture.
- Keep functions small.
- Avoid unnecessary abstractions.
- Add comments only where useful.
- Maintain strict typing.
- Use async/await.
- Keep imports organized.
- Create reusable utilities.
- Do not introduce Redis, BullMQ, PostgreSQL, authentication, streaming, or caching until explicitly instructed.
- After completing a phase, stop and summarize:
  - Files created
  - Files modified
  - What was implemented
  - Any manual actions required
- Wait for approval before continuing to the next phase.

The goal is a clean, maintainable Advanced RAG pipeline that follows this architecture exactly.
```

