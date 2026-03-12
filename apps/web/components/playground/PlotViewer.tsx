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
        src={`data:image/png;base64,${base64}`}
        alt={name}
        onLoad={() => setLoaded(true)}
        className={`w-full transition-opacity duration-150 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ aspectRatio: "auto" }}
      />
    </div>
  );
}
