import { OpenAIEmbeddings } from "@langchain/openai";
import { getEnv } from "@/lib/env";

export const DENSE_MODEL = "text-embedding-3-small";
export const DENSE_VECTOR_SIZE = 1536;

let embeddingsClient: OpenAIEmbeddings | null = null;

function getEmbeddingsClient(): OpenAIEmbeddings {
  if (!embeddingsClient) {
    embeddingsClient = new OpenAIEmbeddings({
      apiKey: getEnv().OPENAI_API_KEY,
      model: DENSE_MODEL,
    });
  }
  return embeddingsClient;
}

/** Generates dense embeddings for a batch of texts using OpenAI's text-embedding-3-small. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return getEmbeddingsClient().embedDocuments(texts);
}

/** Generates a single dense embedding for a query string. */
export async function embedQuery(text: string): Promise<number[]> {
  return getEmbeddingsClient().embedQuery(text);
}
