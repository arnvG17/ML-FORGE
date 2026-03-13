import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MetricCard({ label, value, className = "" }: MetricCardProps) {
  return (
    <div className={`border border-border p-4 ${className}`}>
      <div className="text-[11px] font-mono text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-[28px] font-mono text-white leading-tight mt-1">
        {value}
      </div>
    </div>
  );
}
