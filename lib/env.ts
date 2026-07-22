import { z } from "zod";

/**
 * Schema for all environment variables required by the RAG pipeline.
 * Validated once at startup so failures surface immediately with a clear message.
 */
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  QDRANT_URL: z.string().url("QDRANT_URL must be a valid URL"),
  QDRANT_API_KEY: z.string().min(1, "QDRANT_API_KEY is required"),
  COHERE_API_KEY: z.string().min(1, "COHERE_API_KEY is required"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated environment variables, parsing them on first access.
 * Throws a descriptive error if any required variable is missing or invalid.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration - ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
