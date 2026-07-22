import OpenAI from "openai";
import { getEnv } from "@/lib/env";

let client: OpenAI | null = null;

/**
 * Returns a shared raw OpenAI SDK client, for endpoints LangChain doesn't
 * wrap (e.g. moderation).
 */
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  }
  return client;
}
