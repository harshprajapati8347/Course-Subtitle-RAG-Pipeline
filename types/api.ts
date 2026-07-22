import type { Citation } from "@/types/generation";

/** Request body for `POST /api/ask`. */
export interface AskRequest {
  question: string;
  courseSlug?: string;
}

/** Response body for `POST /api/ask`. */
export interface AskResponse {
  /** True if the input guard blocked the question before it reached retrieval/generation. */
  blocked: boolean;
  blockReason?: string;
  answer?: string;
  citations: Citation[];
  /** False if citations couldn't be fully validated even after the pipeline's retry attempts. */
  isValidated: boolean;
}
