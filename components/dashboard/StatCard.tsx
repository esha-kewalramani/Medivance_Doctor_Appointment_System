import { LucideIcon } from "lucide-react";

const TONES: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  ok: "bg-ok/15 text-ok",
  warn: "bg-warn/15 text-warn",
  bad: "bg-bad/15 text-bad",
  accent: "bg-accent/15 text-accent",
};

export default function StatCard({ label, value, icon: Icon, tone = "primary", hint }: { label: string; value: number | string; icon: LucideIcon; tone?: keyof typeof TONES; hint?: string }) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}><Icon className="h-5 w-5" /></span>
      </div>
    </div>
  );
}
