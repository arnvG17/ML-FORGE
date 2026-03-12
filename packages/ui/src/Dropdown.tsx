import React from "react";

interface DropdownProps {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Dropdown({
  id,
  label,
  options,
  value,
  onChange,
  className = "",
}: DropdownProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-xs font-mono text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black text-white border border-border rounded px-4 py-3 text-sm font-mono appearance-none cursor-pointer focus:outline-none focus:border-white transition-colors duration-150"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
