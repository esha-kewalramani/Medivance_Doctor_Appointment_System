import { useApp } from "@/hooks/useApp";

export function useChartColors() {
  const { theme } = useApp();
  const light = theme === "light";
  return {
    series: light ? ["#7c5cfa", "#ff8a4c", "#22c55e", "#ec4899", "#0ea5e9", "#eab308"] : ["#2296ff", "#ecbe78", "#34d399", "#a78bfa", "#22d3ee", "#f472b6"],
    grid: light ? "#e4e4f5" : "#1c3a73",
    axis: light ? "#706f96" : "#92a8ce",
    tooltipBg: light ? "#ffffff" : "#0a1a3a",
    tooltipBorder: light ? "#ddd9f7" : "#245cbe",
    text: light ? "#221e42" : "#eaf2ff",
  };
}
