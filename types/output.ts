import type { ExecutionResult, OutputControl } from "./execution";

export interface OutputState {
  metrics: Record<string, number | string>;
  plots: Record<string, string>;
  controls: OutputControl[];
  errors: string[];
}

export type { ExecutionResult, OutputControl };
