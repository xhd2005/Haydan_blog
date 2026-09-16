import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        void: "#090a0f",
        porcelain: "#fbfbfd",
      },
      backdropBlur: {
        '3xl': '48px',
        '4xl': '64px',
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-md': '0 8px 30px -4px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
        'glass-lg': '0 16px 48px -8px rgba(0, 0, 0, 0.12), inset 0 1px 2px 0 rgba(255, 255, 255, 0.98)',
        'glass-dark-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0.5px 0 rgba(255, 255, 255, 0.15)',
        'glass-dark-md': '0 12px 36px -4px rgba(0, 0, 0, 0.65), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-dark-lg': '0 24px 60px -8px rgba(0, 0, 0, 0.8), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.25)',
        'glow-emerald': '0 0 24px -2px rgba(16, 185, 129, 0.35)',
        'glow-blue': '0 0 24px -2px rgba(59, 130, 246, 0.35)',
        'glow-amber': '0 0 24px -2px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 24px -2px rgba(244, 63, 94, 0.35)',
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        serif: ["'Instrument Serif'", "Georgia", "serif"],
        handwrite: ["'Caveat'", "'Dancing Script'", "cursive", "sans-serif"],
        dancing: ["'Dancing Script'", "cursive", "sans-serif"],
        playfair: ["'Playfair Display'", "Georgia", "serif"],
        modernSans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
