"use client";
import { Moon, Sun } from "lucide-react";
import { useApp } from "@/hooks/useApp";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const light = theme === "light";
  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={light}
      aria-label={`Switch to ${light ? "dark" : "light"} theme`}
      title={`Switch to ${light ? "dark" : "light"} theme`}
      className="relative h-8 w-[60px] shrink-0 rounded-full border border-line/60 bg-surface/70 transition hover:border-primary"
    >
      <Sun className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent" />
      <Moon className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-accent shadow-md transition-all duration-300 ${light ? "left-1" : "left-[calc(100%-1.75rem)]"}`} />
    </button>
  );
}
