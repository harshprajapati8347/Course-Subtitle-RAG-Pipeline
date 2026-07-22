# Phase 6 — UI

**Status:** Complete (smoke-tested against real OpenAI, Qdrant Cloud, and Cohere via the running dev server)
**Deliverable:** Working demo.

## Summary

Built a basic single-page chat interface on top of the Phase 5 LangGraph
pipeline: a server-side API route that runs the pipeline, and a client
chat page with markdown-rendered answers and citation cards. No
streaming, chat persistence, or auth — consistent with the deferred
scope — but the UI does keep an in-memory, client-side message list so
it feels like a real chat rather than a single-shot form.

## Files Created

### Types

- `types/api.ts` — `AskRequest`, `AskResponse` (the `/api/ask` contract).
- `types/chat.ts` — `ChatMessage` (client-side transcript entry).

### API Route

- `app/api/ask/route.ts` — `POST` handler. Runs `runPipeline()` (Phase 5)
  for the submitted question and returns `{ blocked, blockReason?,
  answer?, citations, isValidated }`. Returns `400` for an empty
  question and `500` (with a friendly message, no stack trace) if the
  pipeline throws.

### Chat UI

- `components/chat/citation-card.tsx` — `CitationCard`. Small card per
  citation: numbered badge, lesson name, and `course · module ·
  mm:ss–mm:ss` (via Phase 4's `formatTimestamp()`).
- `components/chat/chat-message.tsx` — `ChatMessageBubble`. Renders one
  message bubble; assistant answers are rendered as markdown (via
  `react-markdown`), blocked messages are shown as plain destructive-
  colored text, an "Unverified citations" badge appears if
  `isValidated` is `false`, and citation cards are listed under the
  answer when present.
- `components/chat/chat-input.tsx` — `ChatInput`. Controlled text input
  + send button; disabled while a request is in flight.
- `app/page.tsx` — the chat page itself (client component). Holds the
  message list in React state, calls `POST /api/ask` on submit, appends
  the user question immediately and the assistant's reply once the
  response resolves, and auto-scrolls to the newest message.

## Files Modified

- `app/layout.tsx` — updated `<title>`/description metadata from the
  default `create-next-app` placeholder to "Course Q&A Assistant".
- `app/globals.css` — added `@plugin "@tailwindcss/typography";` so
  markdown-rendered answers (paragraphs, lists, bold, etc.) get sensible
  spacing/typography via Tailwind's `prose` classes.
- `package.json` — added `react-markdown` (dependency) and
  `@tailwindcss/typography` (dev dependency).

## Design Notes

- **No course picker**: the chat always searches across all indexed
  courses (`courseSlug` omitted). Only one course is indexed right now,
  and a course selector isn't part of this phase's scope — can be added
  later without touching the pipeline (it already accepts an optional
  `courseSlug`).
- **Citation display**: rather than turning `[1]`/`[2]` markers inline
  into links (which would need custom markdown-AST post-processing), the
  answer text is rendered as-is and a numbered "Sources" list of citation
  cards is shown directly below it — the numbers line up with the
  in-text markers.
- **No streaming**: the "Thinking…" text is shown while the fetch to
  `/api/ask` is in flight; the full answer appears at once when the
  pipeline finishes (per the deferred-scope rule against streaming).
- **Markdown only on assistant bubbles**: `prose`/`react-markdown` are
  applied only to assistant messages. User bubbles use `bg-primary`
  (a dark background in light mode); Tailwind Typography's default
  `prose` color palette assumes a light background, which would have
  made the user's own question hard to read against its dark bubble —
  caught and fixed before finalizing this phase.

## Verification

Ran `npm run dev` and hit the API route directly (bypassing the browser,
since no browser-automation tool is available in this environment) with
real OpenAI, Qdrant Cloud, and Cohere calls:

1. `POST /api/ask` with a real question returned `blocked: false`, a
   correctly cited answer (`[1][2]`), 2 resolved citations with correct
   lesson/module/timestamp metadata, and `isValidated: true`.
2. `POST /api/ask` with `"hi"` returned `blocked: true, blockReason:
   "Question is too short."` immediately, confirming the guard's
   short-circuit reaches the UI layer correctly.

Also confirmed: after clearing a stale `.next` build cache (leftover
from an earlier `next dev` session, unrelated to this phase's code),
`tsc --noEmit`, `next lint`, and `next build` all pass with zero errors,
and the build output now lists both `/` (static) and `/api/ask`
(dynamic) routes.

## Manual Actions Required

**Visual confirmation in an actual browser is recommended** — this
environment has no browser-automation/screenshot tool available, so the
UI was verified by exercising `/api/ask` directly (confirmed correct
data end-to-end) and by code review against the installed shadcn/ui
primitives, rather than by viewing rendered pixels. Run `npm run dev`
and open `http://localhost:3000` to see the chat page live.

---

All 6 phases of the architecture doc are now complete. Let me know if
you'd like any adjustments to the UI, or want to revisit any
deferred/future-improvement items (BullMQ, Redis, streaming, auth,
analytics, etc.) as explicit next steps.
