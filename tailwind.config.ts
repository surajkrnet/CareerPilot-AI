import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Canvas & Floor Tokens
        canvas: "#faf9f5",
        "warm-sand": "#faf9f5",
        "almost-black": "#181715",
        "dark-grey": "#6c6a64",
        "peach-cream": "#efe9de",
        "sunset-orange": "#cc785c",
        "coral-red": "#cc785c",

        // Primary Brand Accent (Coral)
        primary: {
          DEFAULT: "#cc785c",
          active: "#a9583e",
          disabled: "#e6dfd8",
        },

        // Typography Hierarchy Tokens
        ink: "#141413",
        body: {
          DEFAULT: "#3d3d3a",
          strong: "#252523",
        },
        muted: {
          DEFAULT: "#6c6a64",
          soft: "#8e8b82",
        },

        // Hairlines & Borders
        hairline: {
          DEFAULT: "#e6dfd8",
          soft: "#ebe6df",
        },

        // Surface Card Levels
        surface: {
          soft: "#f5f0e8",
          card: "#efe9de",
          "cream-strong": "#e8e0d2",
          dark: "#181715",
          "dark-elevated": "#252320",
          "dark-soft": "#1f1e1b",
        },

        // Dark Surface Overlays & High Contrast
        "on-dark": {
          DEFAULT: "#faf9f5",
          soft: "#a09d96",
        },

        // Functional / State Accents
        accent: {
          teal: "#5db8a6",
          amber: "#e8a55a",
          success: "#5db872",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Tiempos Headline", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        pill: "9999px",
      },
      letterSpacing: {
        "display-2xl": "-2.5px",
        "display-xl": "-1.5px",
        "display-lg": "-1px",
        "display-md": "-0.5px",
        "display-sm": "-0.3px",
      },
      fontSize: {
        "display-260": ["clamp(3rem, 11vw, 13rem)", { lineHeight: "0.88", letterSpacing: "-0.04em" }],
        "display-108": ["clamp(2.25rem, 6.5vw, 6.75rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-44": ["clamp(1.5rem, 3.2vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      animation: {
        "scroll-indicator": "scrollIndicator 2s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "pulse-subtle": "pulse-subtle 2.5s infinite ease-in-out",
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        scrollIndicator: {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "50%": { transform: "scaleY(1)", transformOrigin: "top" },
          "50.1%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.95)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
