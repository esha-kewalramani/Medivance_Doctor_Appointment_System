"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { countdownText } from "@/lib/calendar";

/** "Your appointment is in 2 days" - refreshes every minute. */
export default function Countdown({ date, time }: { date: string; time: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setText(countdownText(date, time));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [date, time]);
  if (!text) return null;
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" role="status">
      <Timer className="h-3.5 w-3.5" /> {text === "now" ? "Your appointment is starting now" : `Your appointment is ${text}`}
    </p>
  );
}
