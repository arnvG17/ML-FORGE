import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#111111",
        elevated: "#1A1A1A",
        border: "#222222",
        muted: "#444444",
        placeholder: "#888888",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        bebas: ["Bebas Neue", "sans-serif"],
        comico: ["Comico", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
