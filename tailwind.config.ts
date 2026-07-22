import type { Config } from "tailwindcss";

// Токени 1:1 з `docs/redesign-plan.md` / ТЗ розділ 2.
// Значення самі беруться з CSS-змінних у app/globals.css :root,
// щоб один і той самий колір не був захардкоджений у двох місцях.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-sunken": "var(--surface-sunken)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-disabled": "var(--ink-disabled)",
        accent: "var(--accent)",
        "accent-press": "var(--accent-press)",
        "accent-soft": "var(--accent-soft)",
        signal: "var(--signal)",
        "signal-soft": "var(--signal-soft)",
        danger: "var(--danger)",
        "on-accent": "var(--on-accent)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        display: ["1.375rem", { lineHeight: "1.875rem", fontWeight: "300" }],
        h1: ["1.25rem", { lineHeight: "1.625rem", fontWeight: "600" }],
        h2: ["1.0625rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        meta: ["0.8125rem", { lineHeight: "1.125rem", fontWeight: "400" }],
        label: [
          "0.75rem",
          { lineHeight: "1rem", fontWeight: "600", letterSpacing: "0.04em" },
        ],
      },
      spacing: {
        1: "var(--s-1)",
        2: "var(--s-2)",
        3: "var(--s-3)",
        4: "var(--s-4)",
        5: "var(--s-5)",
        6: "var(--s-6)",
        8: "var(--s-8)",
        10: "var(--s-10)",
        14: "var(--s-14)",
        18: "var(--s-18)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        mic: "var(--shadow-mic)",
      },
      transitionTimingFunction: {
        product: "cubic-bezier(.32,.72,0,1)",
      },
      transitionDuration: {
        tap: "140ms",
        state: "240ms",
        unwind: "700ms",
      },
    },
  },
  plugins: [],
};

export default config;
