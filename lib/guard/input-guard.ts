import { getOpenAIClient } from "@/lib/llm/openai-client";
import type { GuardResult } from "@/types/guard";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 1000;

/**
 * Validates a raw user question before it enters the retrieval pipeline:
 * rejects empty/too-short/too-long input, then runs it through OpenAI's
 * moderation endpoint to block disallowed content.
 */
export async function runInputGuard(question: string): Promise<GuardResult> {
  const trimmed = question.trim();

  if (trimmed.length < MIN_QUESTION_LENGTH) {
    return { passed: false, reason: "Question is too short." };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { passed: false, reason: `Question exceeds ${MAX_QUESTION_LENGTH} characters.` };
  }

  const moderation = await getOpenAIClient().moderations.create({ input: trimmed });
  const flagged = moderation.results[0]?.flagged ?? false;

  if (flagged) {
    return { passed: false, reason: "Question was flagged as inappropriate." };
  }

  return { passed: true };
}
