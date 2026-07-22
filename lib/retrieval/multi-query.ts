import { z } from "zod";
import { getChatModel } from "@/lib/llm/chat-model";
import { MULTI_QUERY_SYSTEM_PROMPT } from "@/prompts/multi-query.prompt";

/** Number of alternative phrasings generated in addition to the original query. */
export const MULTI_QUERY_VARIANT_COUNT = 3;

const expansionSchema = z.object({
  queries: z.array(z.string().min(1)).length(MULTI_QUERY_VARIANT_COUNT),
});

/**
 * Expands a query into several semantically diverse phrasings to improve
 * recall across dense retrieval. The original query is always included
 * as the first entry of the returned array.
 */
export async function expandQuery(query: string): Promise<string[]> {
  const structuredModel = getChatModel().withStructuredOutput(expansionSchema);

  const result = await structuredModel.invoke([
    { role: "system", content: MULTI_QUERY_SYSTEM_PROMPT },
    { role: "user", content: query },
  ]);

  return [query, ...result.queries];
}
