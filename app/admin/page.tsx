"use client";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck, CheckCircle2, Clock, Stethoscope, Users, XCircle, Sparkles } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/charts/ChartCard";
import { useChartColors } from "@/components/charts/useChartColors";
import AdminQueueMonitor from "@/components/queue/AdminQueueMonitor";
import { useApp } from "@/hooks/useApp";
import { countBy } from "@/hooks/useStats";
import { WEEKDAYS } from "@/types";
import { addDays, parseISO, todayISO, weekdayOf } from "@/lib/utilities";

// Older history is SAMPLE data so charts look meaningful in the demo; recent weeks/months add live bookings.
const SAMPLE_WEEKLY = [34, 38, 41, 37, 45, 49, 52, 47, 55, 58, 54, 61];
const SAMPLE_MONTHLY = [212, 238, 251, 276, 262, 289];

export default function AdminDashboard() {
  const { data } = useApp();
  const c = useChartColors();
  const k = countBy(data.appointments);
  const today = todayISO();
  const tt = { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.text };

  const charts = useMemo(() => {
    const live = data.appointments;
    const trend = Array.from({ length: 12 }, (_, i) => {
      const end = addDays(today, 7 - (11 - i) * 7); const start = addDays(end, -7);
      const n = live.filter((a) => a.date > start && a.date <= end).length;
      return { name: parseISO(addDays(start, 1)).toLocaleDateString("en", { day: "numeric", month: "short" }), appointments: SAMPLE_WEEKLY[i] + n };
    });
    const status = (["pending", "approved", "completed", "cancelled", "rejected"] as const).map((s) => ({ name: s[0].toUpperCase() + s.slice(1), value: live.filter((a) => a.status === s).length }));
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d; });
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const regs = months.map((m) => ({ name: m.toLocaleString("en", { month: "short" }), patients: data.patients.filter((p) => p.registeredAt.slice(0, 7) === key(m)).length }));
    const monthly = months.map((m, i) => ({ name: m.toLocaleString("en", { month: "short" }), appointments: SAMPLE_MONTHLY[i] + live.filter((a) => a.date.slice(0, 7) === key(m)).length }));
    const spec = data.specializations.map((s) => ({ name: s.name, value: data.doctors.filter((d) => d.specialization === s.name).length })).filter((s) => s.value > 0);
    const weekly = WEEKDAYS.map((d) => ({ name: d, activity: live.filter((a) => weekdayOf(a.date) === d).length }));
    return { trend, status, regs, monthly, spec, weekly };
  }, [data, today]);

  const axis = <><CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} /></>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-2xl font-bold sm:text-3xl">Admin dashboard</h1><p className="text-sm text-muted">Platform overview. Charts mix sample history with live bookings.</p></div>
        <span className="badge border-accent/40 bg-accent/10 text-accent"><Sparkles className="h-3 w-3" /> AI assistant queries this week: 128 (sample)</span></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Patients" value={data.patients.length} icon={Users} />
        <StatCard label="Doctors" value={data.doctors.length} icon={Stethoscope} tone="accent" />
        <StatCard label="Appointments" value={k.total} icon={CalendarCheck} />
        <StatCard label="Pending" value={k.pending} icon={Clock} tone="warn" />
        <StatCard label="Completed" value={k.completed} icon={CheckCircle2} tone="ok" />
        <StatCard label="Cancelled" value={k.cancelled + k.rejected} icon={XCircle} tone="bad" />
      </div>

      {/* Hospital-Wide OPD Queue & Floor Monitor */}
      <AdminQueueMonitor />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Appointment trends" subtitle="Line chart - weekly totals">
          <LineChart data={charts.trend}>{axis}<XAxis dataKey="name" stroke={c.axis} tickLine={false} fontSize={11} interval={1} /><YAxis stroke={c.axis} tickLine={false} width={32} /><Tooltip contentStyle={tt} />
            <Line type="monotone" dataKey="appointments" stroke={c.series[0]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} /></LineChart>
        </ChartCard>
        <ChartCard title="Appointment status" subtitle="Pie chart - live data">
          <PieChart><Pie data={charts.status.filter((s) => s.value > 0)} dataKey="value" nameKey="name" outerRadius={90} stroke="none" label={({ name, value }) => `${name} ${value}`} labelLine={false} fontSize={11}>{charts.status.filter((s) => s.value > 0).map((_, i) => <Cell key={i} fill={c.series[i % c.series.length]} />)}</Pie><Tooltip contentStyle={tt} /></PieChart>
        </ChartCard>
        <ChartCard title="Patient registrations" subtitle="Bar chart - new patients per month">
          <BarChart data={charts.regs}>{axis}<XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={28} /><Tooltip contentStyle={tt} cursor={{ fill: "rgba(120,120,255,.08)" }} /><Bar dataKey="patients" fill={c.series[2]} radius={[8, 8, 0, 0]} /></BarChart>
        </ChartCard>
        <ChartCard title="Doctors by specialization" subtitle="Donut chart">
          <PieChart><Pie data={charts.spec} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">{charts.spec.map((_, i) => <Cell key={i} fill={c.series[i % c.series.length]} />)}</Pie><Tooltip contentStyle={tt} /><Legend wrapperStyle={{ color: c.axis, fontSize: 11 }} /></PieChart>
        </ChartCard>
        <ChartCard title="Weekly appointment activity" subtitle="Area chart - by weekday">
          <AreaChart data={charts.weekly}><defs><linearGradient id="wa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c.series[3]} stopOpacity={0.55} /><stop offset="95%" stopColor={c.series[3]} stopOpacity={0} /></linearGradient></defs>{axis}<XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={28} /><Tooltip contentStyle={tt} />
            <Area type="monotone" dataKey="activity" stroke={c.series[3]} strokeWidth={2.5} fill="url(#wa)" /></AreaChart>
        </ChartCard>
        <ChartCard title="Monthly appointment statistics" subtitle="Bar chart - sample history + live">
          <BarChart data={charts.monthly}>{axis}<XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis stroke={c.axis} tickLine={false} width={34} /><Tooltip contentStyle={tt} cursor={{ fill: "rgba(120,120,255,.08)" }} /><Bar dataKey="appointments" fill={c.series[1]} radius={[8, 8, 0, 0]} /></BarChart>
        </ChartCard>
      </div>
    </div>
  );
}
