"use client";

import ControlsRenderer from "./ControlsRenderer";
import MetricCard from "./MetricCard";
import PlotViewer from "./PlotViewer";
import { useOutputStore } from "@/store/output";

interface RightPanelProps {
  sessionId: string;
}

export default function RightPanel({ sessionId }: RightPanelProps) {
  const metrics = useOutputStore((s) => s.metrics);
  const plots = useOutputStore((s) => s.plots);
  const controls = useOutputStore((s) => s.controls);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto bg-black text-white">
      {controls.length > 0 && (
        <div className="px-6 py-5 border-b border-border">
          <ControlsRenderer controls={controls} sessionId={sessionId} />
        </div>
      )}

      {Object.keys(metrics).length > 0 && (
        <div className="px-6 py-5 border-b border-border">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(metrics).map(([key, value]) => (
              <MetricCard key={key} label={key} value={value} />
            ))}
          </div>
        </div>
      )}

      {Object.keys(plots).length > 0 && (
        <div className="px-6 py-5">
          {Object.entries(plots).map(([name, base64]) => (
            <PlotViewer key={name} name={name} base64={base64} />
          ))}
        </div>
      )}

      {controls.length === 0 &&
        Object.keys(metrics).length === 0 &&
        Object.keys(plots).length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-mono font-light text-muted">
              Output will appear here
            </span>
          </div>
        )}
    </div>
  );
}
