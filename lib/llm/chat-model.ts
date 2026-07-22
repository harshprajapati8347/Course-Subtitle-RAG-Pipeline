import { ChatOpenAI } from "@langchain/openai";
import { getEnv } from "@/lib/env";

export const CHAT_MODEL = "gpt-4o-mini";

let chatModel: ChatOpenAI | null = null;

/**
 * Returns a shared chat model instance, created lazily from env config.
 * Used by query rewrite, multi-query expansion, and answer generation.
 */
export function getChatModel(): ChatOpenAI {
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      apiKey: getEnv().OPENAI_API_KEY,
      model: CHAT_MODEL,
    });
  }
  return chatModel;
}
