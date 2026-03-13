"use client";

import { useState } from "react";
import ConversationHistory from "./ConversationHistory";
import IntentInput from "./IntentInput";
import { useSessionStore } from "@/store/session";

interface LeftPanelProps {
  sessionId: string;
}

export default function LeftPanel({ sessionId }: LeftPanelProps) {
  const [sessionName, setSessionName] = useState("Untitled Session");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="w-[280px] min-w-[280px] h-full flex flex-col bg-surface border-r border-border">
      <div className="px-6 py-5 border-b border-border">
        {isEditing ? (
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            autoFocus
            className="w-full bg-transparent text-white font-mono text-sm border-b border-white focus:outline-none pb-1"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="font-mono text-sm text-white hover:text-placeholder transition-colors duration-150 text-left w-full"
          >
            {sessionName}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ConversationHistory sessionId={sessionId} />
      </div>

      <div className="border-t border-border">
        <IntentInput sessionId={sessionId} />
      </div>
    </div>
  );
}
