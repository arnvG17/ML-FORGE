import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-mono text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-black text-white border border-border rounded px-4 py-3 text-sm font-sans placeholder:text-placeholder focus:outline-none focus:border-white transition-colors duration-150 ${className}`}
        {...props}
      />
    </div>
  );
}
