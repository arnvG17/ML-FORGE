"use client";

import { useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAgentStore } from "@/store/agent";
import { useOutputStore } from "@/store/output";

export function useExecution(sessionId: string) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { setStatus } = useAgentStore();
  const { setAll } = useOutputStore();

  const executeWithParams = useCallback(
    (params: Record<string, number | string>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setStatus("running");

        try {
          const result = await api.post<{
            metrics: Record<string, number | string>;
            plots: Record<string, string>;
            controls: Array<{
              id: string;
              type: "slider" | "dropdown";
              label: string;
              min?: number;
              max?: number;
              step?: number;
              default: number | string;
              options?: string[];
              targets_var: string;
            }>;
            errors: string[];
          }>("/execute", {
            session_id: sessionId,
            intent: "",
            params,
          });

          setAll({
            metrics: result.metrics || {},
            plots: result.plots || {},
            controls: result.controls || [],
            errors: result.errors || [],
          });

          setStatus("done");
        } catch (err: any) {
          setAll({
            errors: [err.message || "Execution failed"],
          });
          setStatus("error");
        }
      }, 300);
    },
    [sessionId, setStatus, setAll]
  );

  return { executeWithParams };
}
