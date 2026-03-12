import type { SessionStatus } from "@forge/types";

interface StatusBarProps {
  sessionId: string;
  status: SessionStatus;
}

const statusLabels: Record<SessionStatus, string> = {
  idle: "Idle",
  thinking: "Thinking...",
  writing: "Writing code...",
  running: "Running...",
  done: "Done",
  error: "Error",
};

export default function StatusBar({ sessionId, status }: StatusBarProps) {
  const isPulsing =
    status === "thinking" || status === "writing" || status === "running";

  return (
    <div className="h-10 px-6 flex items-center justify-between border-b border-border bg-black flex-shrink-0">
      <span className="text-xs font-mono font-light text-muted truncate">
        {sessionId.slice(0, 8)}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isPulsing ? "animate-pulse bg-white" : "bg-muted"
          }`}
        />
        <span className="text-xs font-mono font-light text-placeholder">
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}
