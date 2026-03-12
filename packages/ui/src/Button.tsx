import React from "react";

type ButtonVariant = "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({
  variant = "outline",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "font-mono text-sm transition-all duration-150 ease-in-out cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    outline:
      "border border-white bg-transparent text-white px-6 py-3 hover:bg-white hover:text-black",
    ghost:
      "border-none bg-transparent text-[#888888] px-4 py-2 hover:text-white",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
