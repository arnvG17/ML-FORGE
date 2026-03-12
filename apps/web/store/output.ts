import { create } from "zustand";
import type { OutputControl } from "@forge/types";

interface OutputState {
  metrics: Record<string, number | string>;
  plots: Record<string, string>;
  controls: OutputControl[];
  errors: string[];
  setMetrics: (metrics: Record<string, number | string>) => void;
  setPlots: (plots: Record<string, string>) => void;
  setControls: (controls: OutputControl[]) => void;
  setErrors: (errors: string[]) => void;
  setAll: (data: {
    metrics?: Record<string, number | string>;
    plots?: Record<string, string>;
    controls?: OutputControl[];
    errors?: string[];
  }) => void;
  reset: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  metrics: {},
  plots: {},
  controls: [],
  errors: [],

  setMetrics: (metrics) => set({ metrics }),
  setPlots: (plots) => set({ plots }),
  setControls: (controls) => set({ controls }),
  setErrors: (errors) => set({ errors }),

  setAll: (data) =>
    set({
      metrics: data.metrics || {},
      plots: data.plots || {},
      controls: data.controls || [],
      errors: data.errors || [],
    }),

  reset: () =>
    set({
      metrics: {},
      plots: {},
      controls: [],
      errors: [],
    }),
}));
