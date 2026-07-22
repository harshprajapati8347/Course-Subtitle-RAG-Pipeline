import type { Citation } from "@/types/generation";

/** A single message in the client-side chat transcript. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  blocked?: boolean;
  isValidated?: boolean;
}
