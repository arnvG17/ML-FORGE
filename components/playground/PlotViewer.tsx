"use client";

import { useState } from "react";

interface PlotViewerProps {
  name: string;
  base64: string;
}

export default function PlotViewer({ name, base64 }: PlotViewerProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="mb-4">
      <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
        {name}
      </div>
      <img
        key={base64.slice(-20)}
        src={`data:image/png;base64,${base64}`}
        alt={name}
        className="w-full bg-elevated border border-border"
        style={{ aspectRatio: "auto" }}
      />
    </div>
  );
}
