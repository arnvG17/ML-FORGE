import React from "react";
import type { SessionStatus } from "@/types";

interface StatusDotProps {
  status: SessionStatus;
}

const statusColors: Record<SessionStatus, string> = {
  idle: "#444444",
  thinking: "#FFFFFF",
  writing: "#FFFFFF",
  running: "#FFFFFF",
  done: "#888888",
  error: "#FFFFFF",
};

export function StatusDot({ status }: StatusDotProps) {
  const color = statusColors[status];
  const isPulsing =
    status === "thinking" || status === "writing" || status === "running";

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        isPulsing ? "animate-pulse" : ""
      }`}
      style={{ backgroundColor: color }}
    />
  );
}
