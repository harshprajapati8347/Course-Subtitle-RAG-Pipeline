import { getChatModel } from "@/lib/llm/chat-model";
import { GENERATION_SYSTEM_PROMPT } from "@/prompts/generation.prompt";

/**
 * Generates a grounded answer for `question` using the given context
 * block, instructed to cite sources with `[n]` markers matching the
 * context's numbered sources. An optional `feedback` string can be passed
 * on retry (e.g. after citation validation fails) to steer the model away
 * from its previous mistake.
 */
export async function generateAnswer(
  question: string,
  contextText: string,
  feedback?: string
): Promise<string> {
  const feedbackBlock = feedback ? `\n\n(Note: ${feedback})` : "";
  const userMessage = `Context:\n${contextText}\n\nQuestion: ${question}${feedbackBlock}`;

  const response = await getChatModel().invoke([
    { role: "system", content: GENERATION_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  return response.text.trim();
}
