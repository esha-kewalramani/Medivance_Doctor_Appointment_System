"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Bot, CalendarCheck, CalendarClock, CalendarX2, CheckCircle2, Mail, Phone, Droplets } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HealthSummary from "@/components/dashboard/HealthSummary";
import Countdown from "@/components/appointments/Countdown";
import ChartCard from "@/components/charts/ChartCard";
import { useChartColors } from "@/components/charts/useChartColors";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/hooks/useApp";
import { addDays, fmtDate, fmtTime, parseISO, timeAgo, todayISO } from "@/lib/utilities";

export default function PatientDashboard() {
  const { data, session, user, doctorById } = useApp();
  const c = useChartColors();
  const me = data.patients.find((p) => p.id === session?.userId);
  const mine = useMemo(() => data.appointments.filter((a) => a.patientId === session?.userId), [data.appointments, session]);
  const today = todayISO();
  const upcoming = mine.filter((a) => ["pending", "approved"].includes(a.status) && a.date >= today).sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
  const completed = mine.filter((a) => a.status === "completed").length;
  const cancelled = mine.filter((a) => ["cancelled", "rejected"].includes(a.status)).length;
  const statusData = (["pending", "approved", "completed", "cancelled", "rejected"] as const).map((s) => ({ name: s[0].toUpperCase() + s.slice(1), value: mine.filter((a) => a.status === s).length })).filter((x) => x.value > 0);
  const weekly = Array.from({ length: 6 }, (_, i) => {
    const end = addDays(today, 7 - (5 - i) * 7); const start = addDays(end, -7);
    const label = parseISO(addDays(start, 1)).toLocaleDateString("en", { day: "numeric", month: "short" });
    return { name: label, visits: mine.filter((a) => a.date > start && a.date <= end).length };
  });
  const recent = [...mine].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={user?.name ?? "Patient"} size={72} />
          <div className="flex-1">
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{user?.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {me?.email}</span>
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {me?.phone}</span>
              {me?.bloodGroup && <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {me.bloodGroup}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/patient/book" className="btn-primary">Book appointment</Link><Link href="/patient/assistant" className="btn-ghost"><Bot className="h-4 w-4" /> Ask AI</Link></div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total appointments" value={mine.length} icon={CalendarCheck} />
        <StatCard label="Upcoming" value={upcoming.length} icon={CalendarClock} tone="warn" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="ok" />
        <StatCard label="Cancelled" value={cancelled} icon={CalendarX2} tone="bad" />
      </div>

      <HealthSummary />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Appointments by status" subtitle="Your bookings" className="lg:col-span-1">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">{statusData.map((_, i) => <Cell key={i} fill={c.series[i % c.series.length]} />)}</Pie>
            <Tooltip contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.text }} />
            <Legend wrapperStyle={{ color: c.axis, fontSize: 12 }} />
          </PieChart>
        </ChartCard>
        <ChartCard title="Visits per week" subtitle="Weeks starting on the date shown (latest = coming week)" className="lg:col-span-2">
          <BarChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
            <XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.text }} cursor={{ fill: "rgba(120,120,255,.08)" }} />
            <Bar dataKey="visits" fill={c.series[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Next appointment</h2>
          {upcoming[0] ? (() => { const a = upcoming[0]; const d = doctorById(a.doctorId); return (
            <div className="flex items-center gap-4 rounded-xl border border-line/40 bg-primary/5 p-4">
              <Avatar name={d?.name ?? "Doctor"} photo={d?.photo} size={52} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{d?.name}</p><p className="text-xs text-muted">{d?.specialization}</p><p className="mt-1 text-sm font-semibold text-primary">{fmtDate(a.date)} - {fmtTime(a.time)}</p><Countdown date={a.date} time={a.time} /></div>
              <StatusBadge status={a.status} />
            </div>); })() : <EmptyState title="Nothing scheduled" text="Book your next visit in a few clicks." action={<Link href="/patient/book" className="btn-primary btn-sm">Book now</Link>} />}
        </section>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recent activity</h2><Link href="/patient/appointments" className="text-xs font-semibold text-primary">View all</Link></div>
          {recent.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
            <ul className="space-y-2.5">{recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{doctorById(a.doctorId)?.name ?? "Doctor"}</span><span className="text-xs text-muted">{a.ref} - {timeAgo(a.createdAt)}</span></span><StatusBadge status={a.status} /></li>
            ))}</ul>)}
        </section>
      </div>
    </div>
  );
}
