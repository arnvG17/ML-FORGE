"use client";

import { useAgentStore } from "@/store/agent";

interface ConversationHistoryProps {
  sessionId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ConversationHistory({
  sessionId,
}: ConversationHistoryProps) {
  const messages = useAgentStore((s) => s.messages);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <span className="text-xs font-mono text-muted text-center">
          Start by describing what you want to build
        </span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {messages.map((msg: Message, i: number) => (
        <div key={i} className="flex mb-4">
          <div
            className={`w-0.5 mr-3 flex-shrink-0 ${
              msg.role === "user" ? "bg-white" : "bg-muted"
            }`}
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-muted mb-1 uppercase">
              {msg.role}
            </div>
            <p className="text-sm text-white leading-relaxed break-words">
              {msg.content.length > 300
                ? msg.content.slice(0, 300) + "..."
                : msg.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
