"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ChatInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

/** Controlled question input + send button for the chat page. */
export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const question = value.trim();
    if (!question || disabled) return;

    onSubmit(question);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask a question about the course..."
        disabled={disabled}
        className="h-11"
      />
      <Button
        type="submit"
        size="lg"
        disabled={disabled || value.trim().length === 0}
      >
        Send
      </Button>
    </form>
  );
}
