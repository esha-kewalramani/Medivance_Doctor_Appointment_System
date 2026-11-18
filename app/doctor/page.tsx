"use client";
import Avatar from "@/components/ui/Avatar";
import { useMemo } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Ban, CalendarCheck, CheckCircle2, Clock, Sparkles, ThumbsUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/charts/ChartCard";
import { useChartColors } from "@/components/charts/useChartColors";
import StatusBadge from "@/components/ui/StatusBadge";
import { useApp } from "@/hooks/useApp";
import { countBy } from "@/hooks/useStats";
import { WEEKDAYS } from "@/types";
import { addDays, fmtTime, timeAgo, todayISO, weekdayOf } from "@/lib/utilities";

export default function DoctorDashboard() {
  const { data, session, user, patientById } = useApp();
  const c = useChartColors();
  const mine = useMemo(() => data.appointments.filter((a) => a.doctorId === session?.userId), [data.appointments, session]);
  const k = countBy(mine);
  const today = todayISO();
  const todays = mine.filter((a) => a.date === today && ["pending", "approved"].includes(a.status)).sort((a, b) => (a.time > b.time ? 1 : -1));
  const byDay = WEEKDAYS.map((d) => ({ name: d, total: mine.filter((a) => weekdayOf(a.date) === d && a.status !== "cancelled" && a.status !== "rejected").length }));
  const trend = Array.from({ length: 14 }, (_, i) => { const d = addDays(today, i - 7); return { name: d.slice(5), count: mine.filter((a) => a.date === d && a.status !== "cancelled" && a.status !== "rejected").length }; });
  const busiest = [...byDay].sort((a, b) => b.total - a.total)[0];
  const recent = [...mine].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  const tt = { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.text };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Avatar name={user?.name ?? "Doctor"} photo={user?.photo} size={64} /><div><p className="text-sm text-muted">Good day,</p><h1 className="font-display text-2xl font-bold sm:text-3xl">{user?.name}</h1></div></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total" value={k.total} icon={CalendarCheck} />
        <StatCard label="Pending requests" value={k.pending} icon={Clock} tone="warn" />
        <StatCard label="Approved" value={k.approved} icon={ThumbsUp} tone="ok" />
        <StatCard label="Completed" value={k.completed} icon={CheckCircle2} />
        <StatCard label="Cancelled / rejected" value={k.cancelled + k.rejected} icon={Ban} tone="bad" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Weekly appointment graph" subtitle="Appointments by weekday" className="lg:col-span-2">
          <BarChart data={byDay}><CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} /><XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={28} />
            <Tooltip contentStyle={tt} cursor={{ fill: "rgba(120,120,255,.08)" }} /><Bar dataKey="total" fill={c.series[0]} radius={[8, 8, 0, 0]} /></BarChart>
        </ChartCard>
        <div className="card flex flex-col p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-5 w-5 text-accent" /> AI insight <span className="badge border-accent/40 bg-accent/10 text-accent">Demo</span></h3>
          <p className="mt-3 text-sm text-muted">{busiest && busiest.total > 0 ? <>Your busiest day is <b className="text-fg">{busiest.name}</b> with {busiest.total} appointments. Consider adding extra slots on that day or opening a quieter day.</> : "Not enough data yet to suggest changes."}</p>
          <p className="mt-2 text-xs text-muted">Calculated locally from your appointment counts (simulated, not a live AI model).</p>
          <Link href="/doctor/availability" className="btn-primary btn-sm mt-auto w-fit">Manage availability</Link>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Two-week trend" subtitle="Past 7 and next 7 days" className="lg:col-span-2">
          <AreaChart data={trend}><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c.series[1]} stopOpacity={0.5} /><stop offset="95%" stopColor={c.series[1]} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} /><XAxis dataKey="name" stroke={c.axis} tickLine={false} fontSize={11} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={28} /><Tooltip contentStyle={tt} />
            <Area type="monotone" dataKey="count" stroke={c.series[1]} strokeWidth={2.5} fill="url(#dg)" /></AreaChart>
        </ChartCard>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Today</h3><Link href="/doctor/appointments" className="text-xs font-semibold text-primary">All requests</Link></div>
          {todays.length === 0 ? <p className="text-sm text-muted">No appointments today.</p> : <ul className="space-y-2">{todays.map((a) => <li key={a.id} className="flex items-center justify-between gap-2 text-sm"><span><span className="font-semibold">{fmtTime(a.time)}</span> - {patientById(a.patientId)?.name ?? "Patient"}</span><StatusBadge status={a.status} /></li>)}</ul>}
        </section>
      </div>
      <section className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Recent activity</h3>
        <ul className="divide-y divide-line/30">{recent.map((a) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span><span className="font-semibold">{patientById(a.patientId)?.name ?? "Patient"}</span> <span className="text-muted">- {a.ref} - {timeAgo(a.createdAt)}</span></span><StatusBadge status={a.status} /></li>)}</ul>
      </section>
    </div>
  );
}
