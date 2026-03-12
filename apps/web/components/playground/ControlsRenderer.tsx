"use client";

import { useState } from "react";
import type { OutputControl } from "@forge/types";
import { useExecution } from "@/hooks/useExecution";

interface ControlsRendererProps {
  controls: OutputControl[];
  sessionId: string;
}

export default function ControlsRenderer({
  controls,
  sessionId,
}: ControlsRendererProps) {
  const [values, setValues] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    for (const control of controls) {
      initial[control.targets_var] = control.default;
    }
    return initial;
  });

  const { executeWithParams } = useExecution(sessionId);

  const handleChange = (targetsVar: string, value: number | string) => {
    const newValues = { ...values, [targetsVar]: value };
    setValues(newValues);
    executeWithParams(newValues);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-[10px] font-mono text-muted uppercase tracking-wider">
        Controls
      </div>
      {controls.map((control) => {
        if (control.type === "slider") {
          return (
            <div key={control.id} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor={control.id}
                  className="text-xs font-mono font-light text-muted"
                >
                  {control.label}
                </label>
                <span className="text-xs font-mono text-white">
                  {values[control.targets_var]}
                </span>
              </div>
              <input
                id={control.id}
                type="range"
                min={control.min ?? 0}
                max={control.max ?? 100}
                step={control.step ?? 1}
                value={Number(values[control.targets_var]) || 0}
                onChange={(e) =>
                  handleChange(control.targets_var, parseFloat(e.target.value))
                }
                className="w-full h-1 bg-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          );
        }

        if (control.type === "dropdown") {
          return (
            <div key={control.id} className="flex flex-col gap-2">
              <label
                htmlFor={control.id}
                className="text-xs font-mono font-light text-muted"
              >
                {control.label}
              </label>
              <select
                id={control.id}
                value={String(values[control.targets_var])}
                onChange={(e) =>
                  handleChange(control.targets_var, e.target.value)
                }
                className="w-full bg-black text-white border border-border rounded px-4 py-3 text-sm font-mono appearance-none cursor-pointer focus:outline-none focus:border-white transition-colors duration-150"
              >
                {(control.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
