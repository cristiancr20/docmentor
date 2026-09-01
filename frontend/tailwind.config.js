/** @type {import('tailwindcss').Config} */

// Los colores apuntan a las variables CSS definidas en src/index.css, que se
// redeclaran bajo `:root.dark`. Por eso el markup no necesita variantes `dark:`:
// `bg-surface` ya es lo correcto en ambos temas.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        content: "var(--content)",
        muted: "var(--muted)",

        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-wash": "var(--accent-wash)",
        "on-accent": "var(--on-accent)",

        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        info: "var(--info)",
        "ok-wash": "var(--ok-wash)",
        "warn-wash": "var(--warn-wash)",
        "danger-wash": "var(--danger-wash)",
        "info-wash": "var(--info-wash)",

        // Rampa fija para la barra lateral, que es oscura en ambos temas.
        "dark-surface": "var(--dark-surface)",
        "dark-surface-2": "var(--dark-surface-2)",
        "dark-line": "var(--dark-line)",
        "dark-content": "var(--dark-content)",
        "dark-muted": "var(--dark-muted)",
        "dark-accent": "var(--dark-accent)",
        "dark-accent-wash": "var(--dark-accent-wash)",
        "dark-on-accent": "var(--dark-on-accent)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
      maxWidth: {
        content: "1100px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease both",
      },
    },
  },
  plugins: [],
};
