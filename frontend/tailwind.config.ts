import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "euryx-cyan": "#00f0ff",
        "euryx-fuchsia": "#ff00ff",
        "euryx-bg-primary": "#020617",
        "euryx-bg-secondary": "#000000",
        "euryx-surface": "#0f172a",
      },
      fontFamily: {
        heading: ['"Unbounded"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', "monospace"],
        accent: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,240,255,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(0,240,255,0.8), 0 0 60px rgba(255,0,255,0.4)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
