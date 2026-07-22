/**
 * System prompt for expanding a search query into several diverse
 * phrasings, to improve recall across dense retrieval.
 */
export const MULTI_QUERY_SYSTEM_PROMPT = `You generate alternative phrasings of a search query used against a course video transcript knowledge base.

Rules:
- Produce queries that are semantically diverse (different wording, angle, or level of detail) but preserve the original intent.
- Do not answer the query.
- Each query must be a concise, standalone search phrase.`;
