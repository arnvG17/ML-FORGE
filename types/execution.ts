export interface ExecutionRequest {
  session_id: string;
  script: string;
  layer?: number;
  params?: Record<string, unknown>;
}

export interface ExecutionResult {
  metrics: Record<string, number | string>;
  plots: Record<string, string>;
  controls: OutputControl[];
  errors: string[];
}

export interface OutputControl {
  id: string;
  type: "slider" | "dropdown";
  label: string;
  min?: number;
  max?: number;
  step?: number;
  default: number | string;
  options?: string[];
  targets_var: string;
}
