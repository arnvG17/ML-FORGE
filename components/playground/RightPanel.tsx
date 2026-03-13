"use client";

import ControlsRenderer from "./ControlsRenderer";
import MetricCard from "./MetricCard";
import PlotViewer from "./PlotViewer";
import { useOutputStore } from "@/store/output";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { useAgentStore } from "@/store/agent";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface RightPanelProps {
  sessionId: string;
}

export default function RightPanel({ sessionId }: RightPanelProps) {
  const metrics = useOutputStore((s) => s.metrics);
  const plots = useOutputStore((s) => s.plots);
  const controls = useOutputStore((s) => s.controls);
  const explanation = useOutputStore((s) => s.explanation);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto bg-black text-white pb-6 px-1">
      {explanation && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-6 mb-2 p-4 rounded-2xl bg-white/[0.03] border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Insight</span>
          </div>
          <p className="text-xs font-mono leading-relaxed text-zinc-400">
            {explanation}
          </p>
        </motion.div>
      )}

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
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <MorphingSquare 
              message={useAgentStore.getState().status === 'thinking' ? 'Generating...' : 'Waiting for output...'} 
              className="w-12 h-12 bg-white/20"
            />
          </div>
        )}
    </div>
  );
}
