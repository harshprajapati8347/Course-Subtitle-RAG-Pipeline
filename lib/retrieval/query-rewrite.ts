import { z } from "zod";
import { getChatModel } from "@/lib/llm/chat-model";
import { QUERY_REWRITE_SYSTEM_PROMPT } from "@/prompts/query-rewrite.prompt";

const rewriteSchema = z.object({
  rewrittenQuery: z.string().min(1),
});

/**
 * Rewrites a raw user question into a clear, standalone search query:
 * fixes typos/grammar and strips conversational filler that would
 * otherwise hurt embedding similarity at retrieval time.
 */
export async function rewriteQuery(question: string): Promise<string> {
  const structuredModel = getChatModel().withStructuredOutput(rewriteSchema);

  const result = await structuredModel.invoke([
    { role: "system", content: QUERY_REWRITE_SYSTEM_PROMPT },
    { role: "user", content: question },
  ]);

  return result.rewrittenQuery.trim();
}
