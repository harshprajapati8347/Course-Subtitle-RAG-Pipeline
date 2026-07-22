import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CitationCard } from "@/components/chat/citation-card";
import type { ChatMessage } from "@/types/chat";

/** Renders a single user or assistant message, with citation cards under grounded answers. */
export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-3 rounded-2xl px-4 py-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10"
        )}
      >
        {message.blocked ? (
          <p className="text-sm text-destructive">{message.content}</p>
        ) : isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {!message.blocked && message.isValidated === false && (
          <Badge variant="destructive" className="w-fit">
            Unverified citations
          </Badge>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
            <span className="text-xs font-medium text-muted-foreground">Sources</span>
            {message.citations.map((citation) => (
              <CitationCard key={`${citation.chunkId}-${citation.index}`} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
