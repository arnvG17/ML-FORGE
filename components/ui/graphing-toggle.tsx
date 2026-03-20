"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphingToggleProps {
  className?: string;
  isEnabled: boolean;
  onToggle: () => void;
}

export function GraphingToggle({ className, isEnabled, onToggle }: GraphingToggleProps) {
  return (
    <div className={cn("flex items-center bg-surface border border-border rounded-lg p-1 gap-1", className)}>
      <button
        onClick={() => !isEnabled && onToggle()}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all",
          isEnabled 
            ? "bg-primary text-primary-foreground" 
            : "text-muted hover:text-foreground hover:bg-foreground/5"
        )}
      >
        <BarChart3 className="w-3 h-3" />
        <span>GRAPH</span>
      </button>
      <button
        onClick={() => isEnabled && onToggle()}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all",
          !isEnabled 
            ? "bg-primary text-primary-foreground" 
            : "text-muted hover:text-foreground hover:bg-foreground/5"
        )}
      >
        <span>CHAT</span>
      </button>
    </div>
  )
}
