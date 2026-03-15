import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        border: "var(--border)",
        muted: "var(--muted)",
        placeholder: "var(--placeholder)",
        primary: "var(--primary)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        bebas: ["Bebas Neue", "sans-serif"],
        comico: ["Comico", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
