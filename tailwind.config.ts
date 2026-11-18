import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", ':root[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        card: v("card"),
        line: v("line"),
        fg: v("fg"),
        muted: v("muted"),
        primary: v("primary"),
        "primary-fg": v("primary-fg"),
        accent: v("accent"),
        "accent-fg": v("accent-fg"),
        ok: v("ok"),
        warn: v("warn"),
        bad: v("bad"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "var(--glow)",
        soft: "0 10px 30px -12px rgb(var(--shadow) / 0.35)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
        pop: { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
        dots: { "0%,80%,100%": { opacity: ".2" }, "40%": { opacity: "1" } },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        fadeUp: "fadeUp .5s ease both",
        pop: "pop .25s ease both",
        dots: "dots 1.2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
