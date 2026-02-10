import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        card: "#0B1020",
        card2: "#0A0F1E",
        stroke: "rgba(255,255,255,0.08)",
        soft: "rgba(255,255,255,0.06)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 18px 80px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
} satisfies Config;
