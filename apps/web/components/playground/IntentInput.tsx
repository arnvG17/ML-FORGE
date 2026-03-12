"use client";

import { useState, useRef, useCallback } from "react";
import { useAgentStream } from "@/hooks/useAgentStream";

interface IntentInputProps {
  sessionId: string;
}

export default function IntentInput({ sessionId }: IntentInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendIntent, isStreaming } = useAgentStream(sessionId);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;

    sendIntent(trimmed);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, sendIntent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  };

  return (
    <div className="px-4 py-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Describe what you want to build..."
        rows={1}
        disabled={isStreaming}
        className="w-full bg-black text-white border border-border rounded px-4 py-3 text-sm placeholder:text-placeholder focus:outline-none focus:border-white transition-colors duration-150 resize-none disabled:opacity-40"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-muted font-mono">
          {isStreaming ? "Generating..." : "Cmd+Enter to send"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={isStreaming || !value.trim()}
          className="text-xs font-mono text-placeholder hover:text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
