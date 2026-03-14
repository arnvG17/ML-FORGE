"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useOrchestrator } from "@/hooks/useOrchestrator";
import { useOutputStore } from "@/store/output";
import { useAgentStore } from "@/store/agent";
import ControlsRenderer from "@/components/playground/ControlsRenderer";
import MetricCard from "@/components/playground/MetricCard";
import PlotViewer from "@/components/playground/PlotViewer";
import Link from "next/link";

export default function EmbedPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  const { reigniteSharedSession } = useOrchestrator();
  const metrics = useOutputStore((s) => s.metrics);
  const plots = useOutputStore((s) => s.plots);
  const controls = useOutputStore((s) => s.controls);
  const status = useAgentStore((s) => s.status);
  const [notFound, setNotFound] = useState(false);
  const hasReignited = useRef(false);

  useEffect(() => {
    if (hasReignited.current) return;
    hasReignited.current = true;

    async function load() {
      const res = await fetch(`/api/sessions/share/${shareToken}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      await reigniteSharedSession(shareToken);
    }
    load();
  }, [shareToken, reigniteSharedSession]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white font-mono text-xs">Session not found or private.</p>
      </div>
    );
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="min-h-screen bg-black text-white flex flex-col">
          {status === "running" && (
            <div className="px-4 pt-4 pb-2">
              <span className="text-[10px] font-mono text-zinc-500">Running...</span>
            </div>
          )}

          {controls.length > 0 && (
            <div className="px-4 py-4 border-b border-white/10">
              <ControlsRenderer controls={controls} sessionId={shareToken} />
            </div>
          )}

          {Object.keys(metrics).length > 0 && (
            <div className="px-4 py-4 border-b border-white/10">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(metrics).map(([key, value]) => (
                  <MetricCard key={key} label={key} value={value} />
                ))}
              </div>
            </div>
          )}

          {Object.keys(plots).length > 0 && (
            <div className="px-4 py-4">
              {Object.entries(plots).map(([name, base64]) => (
                <PlotViewer key={name} name={name} base64={base64 as string} />
              ))}
            </div>
          )}

          <div className="mt-auto px-4 py-3 text-right">
            <Link
              href={`/p/${shareToken}`}
              target="_blank"
              className="text-[10px] font-mono text-zinc-600 hover:text-white transition-colors"
            >
              Open in Forge →
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
