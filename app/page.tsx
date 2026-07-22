"use client";

import { useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import type { AskResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

function makeId(): string {
  return crypto.randomUUID();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function handleSend(question: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: question }]);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await response.json()) as AskResponse;

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: data.blocked ? (data.blockReason ?? "This question was blocked.") : (data.answer ?? ""),
          citations: data.citations,
          blocked: data.blocked,
          isValidated: data.isValidated,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: "Something went wrong reaching the server. Please try again.",
          blocked: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <div className="flex h-screen w-full max-w-3xl flex-col bg-white dark:bg-black">
        <header className="flex flex-col gap-1 border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold">Course Q&amp;A Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about the indexed course and get grounded, cited answers.
          </p>
        </header>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 px-6 py-6">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No messages yet — ask a question about the course to get started.
              </p>
            )}
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <p className="text-sm text-muted-foreground">Thinking…</p>}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border px-6 py-4">
          <ChatInput onSubmit={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
