import { QdrantClient } from "@qdrant/js-client-rest";
import { getEnv } from "@/lib/env";

let client: QdrantClient | null = null;

/** Returns a shared Qdrant client instance, created lazily from env config. */
export function getQdrantClient(): QdrantClient {
  if (!client) {
    const env = getEnv();
    client = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });
  }
  return client;
}
