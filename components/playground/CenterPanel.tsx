"use client";

import StatusBar from "./StatusBar";
import CodeEditor from "./CodeEditor";
import { useAgentStore } from "@/store/agent";

interface CenterPanelProps {
  sessionId: string;
}

export default function CenterPanel({ sessionId }: CenterPanelProps) {
  const code = useAgentStore((s) => s.code);
  const status = useAgentStore((s) => s.status);

  return (
    <div className="w-full h-full flex flex-col bg-surface border-l border-border">
      <StatusBar sessionId={sessionId} status={status} />
      <div className="flex-1 overflow-hidden">
        <CodeEditor code={code} />
      </div>
    </div>
  );
}
