import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

/**
 * 이어줌 (Connecting) — Tailwind Configuration
 *
 * Romantic pink theme with soft gradients.
 * Uses CSS variables for shadcn/ui compatibility.
 * Mobile-first breakpoints.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      // ── Romantic Pink Color Palette ──
      colors: {
        // Primary: warm pink tones
        primary: {
          DEFAULT: "hsl(340, 82%, 62%)",     // #E84393 — main pink
          50: "hsl(340, 100%, 97%)",          // Lightest pink bg
          100: "hsl(340, 95%, 93%)",
          200: "hsl(340, 90%, 85%)",
          300: "hsl(340, 85%, 75%)",
          400: "hsl(340, 82%, 68%)",
          500: "hsl(340, 82%, 62%)",          // Base
          600: "hsl(340, 75%, 52%)",
          700: "hsl(340, 70%, 42%)",
          800: "hsl(340, 65%, 32%)",
          900: "hsl(340, 60%, 22%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        // Secondary: soft rose
        secondary: {
          DEFAULT: "hsl(350, 80%, 72%)",
          foreground: "hsl(340, 60%, 22%)",
        },
        // Accent: peach/coral
        accent: {
          DEFAULT: "hsl(15, 90%, 75%)",
          foreground: "hsl(15, 60%, 22%)",
        },
        // Neutral backgrounds
        background: "hsl(340, 30%, 99%)",     // Slightly warm white
        foreground: "hsl(340, 20%, 15%)",     // Dark warm text
        // Card styling
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(340, 20%, 15%)",
        },
        // Muted text
        muted: {
          DEFAULT: "hsl(340, 20%, 96%)",
          foreground: "hsl(340, 10%, 45%)",
        },
        // Borders
        border: "hsl(340, 30%, 90%)",
        input: "hsl(340, 30%, 90%)",
        ring: "hsl(340, 82%, 62%)",
        // Destructive (errors)
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        // Popover
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(340, 20%, 15%)",
        },
        // Chart colors (if needed)
        chart: {
          1: "hsl(340, 82%, 62%)",
          2: "hsl(350, 80%, 72%)",
          3: "hsl(15, 90%, 75%)",
          4: "hsl(330, 70%, 55%)",
          5: "hsl(0, 85%, 65%)",
        },
      },
      // ── Border Radius (Rounded/Soft) ──
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      // ── Font Family ──
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Helvetica Neue",
          "Apple SD Gothic Neo",
          "sans-serif",
        ],
      },
      // ── Animations ──
      keyframes: {
        "heart-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "heart-beat": "heart-beat 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
      },
      // ── Background Gradients (used in CSS) ──
      backgroundImage: {
        "gradient-romantic": "linear-gradient(135deg, hsl(340, 100%, 97%) 0%, hsl(350, 80%, 95%) 50%, hsl(15, 90%, 95%) 100%)",
        "gradient-pink": "linear-gradient(135deg, hsl(340, 82%, 62%) 0%, hsl(350, 80%, 72%) 100%)",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
