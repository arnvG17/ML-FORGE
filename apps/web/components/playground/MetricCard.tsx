interface MetricCardProps {
  label: string;
  value: string | number;
}

export default function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="border border-border p-4">
      <div className="text-[11px] font-mono text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-[28px] font-mono text-white leading-tight mt-1">
        {typeof value === "number" ? value.toFixed(4) : value}
      </div>
    </div>
  );
}
