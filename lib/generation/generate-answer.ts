import { getChatModel } from "@/lib/llm/chat-model";
import { GENERATION_SYSTEM_PROMPT } from "@/prompts/generation.prompt";

/**
 * Generates a grounded answer for `question` using the given context
 * block, instructed to cite sources with `[n]` markers matching the
 * context's numbered sources.
 */
export async function generateAnswer(question: string, contextText: string): Promise<string> {
  const userMessage = `Context:\n${contextText}\n\nQuestion: ${question}`;

  const response = await getChatModel().invoke([
    { role: "system", content: GENERATION_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  return response.text.trim();
}
