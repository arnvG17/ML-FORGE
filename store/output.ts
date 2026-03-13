import { create } from "zustand";
import type { OutputControl } from "@/types";

interface OutputState {
  metrics: Record<string, number | string>;
  plots: Record<string, string>;
  controls: OutputControl[];
  explanation: string;
  errors: string[];
  setMetrics: (metrics: Record<string, number | string>) => void;
  setPlots: (plots: Record<string, string>) => void;
  setControls: (controls: OutputControl[]) => void;
  setExplanation: (explanation: string) => void;
  setErrors: (errors: string[]) => void;
  setAll: (data: {
    metrics?: Record<string, number | string>;
    plots?: Record<string, string>;
    controls?: OutputControl[];
    explanation?: string;
    errors?: string[];
  }) => void;
  reset: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  metrics: {},
  plots: {},
  controls: [],
  explanation: "",
  errors: [],

  setMetrics: (metrics) => set({ metrics }),
  setPlots: (plots) => set({ plots }),
  setControls: (controls) => set({ controls }),
  setExplanation: (explanation) => set({ explanation }),
  setErrors: (errors) => set({ errors }),

  setAll: (data) =>
    set({
      metrics: data.metrics || {},
      plots: data.plots || {},
      controls: data.controls || [],
      explanation: data.explanation || "",
      errors: data.errors || [],
    }),

  reset: () =>
    set({
      metrics: {},
      plots: {},
      controls: [],
      explanation: "",
      errors: [],
    }),
}));
