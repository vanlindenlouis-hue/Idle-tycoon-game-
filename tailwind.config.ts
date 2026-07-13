import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 28px rgba(45, 212, 191, 0.22)",
        gold: "0 0 28px rgba(250, 204, 21, 0.22)",
      },
      keyframes: {
        shine: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        shine: "shine 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
