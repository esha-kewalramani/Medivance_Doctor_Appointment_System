"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/charts/ChartCard";
import { useChartColors } from "@/components/charts/useChartColors";
import { CalendarCheck, CheckCircle2, UserPlus, XCircle } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { countBy } from "@/hooks/useStats";
import { downloadCsv } from "@/lib/utilities/csv";
import { addDays, fmtDate, fmtTime, pad, parseISO, todayISO, weekdayOf } from "@/lib/utilities";
import { WEEKDAYS } from "@/types";
import { toast } from "@/components/notifications/alerts";

export default function AdminReportsPage() {
  const { data, doctorById, patientById } = useApp();
  const c = useChartColors();
  const today = todayISO();
  const [from, setFrom] = useState(addDays(today, -180));
  const [to, setTo] = useState(addDays(today, 60));
  const [doc, setDoc] = useState("all");
  const tt = { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.text };

  const appts = useMemo(() => data.appointments.filter((a) => a.date >= from && a.date <= to && (doc === "all" || a.doctorId === doc)), [data.appointments, from, to, doc]);
  const k = countBy(appts);
  const newPatients = data.patients.filter((p) => p.registeredAt.slice(0, 10) >= from && p.registeredAt.slice(0, 10) <= to);
  const activePatients = new Set(appts.map((a) => a.patientId)).size;

  const monthly = useMemo(() => {
    const out: { key: string; name: string; total: number; completed: number; cancelled: number }[] = [];
    const s = parseISO(from); const e = parseISO(to);
    const d = new Date(s.getFullYear(), s.getMonth(), 1);
    while (d <= e && out.length < 24) {
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      const l = appts.filter((a) => a.date.slice(0, 7) === key);
      out.push({ key, name: d.toLocaleString("en", { month: "short", year: "2-digit" }), total: l.length, completed: l.filter((a) => a.status === "completed").length, cancelled: l.filter((a) => a.status === "cancelled" || a.status === "rejected").length });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [appts, from, to]);
  const weekly = WEEKDAYS.map((d) => ({ name: d, appointments: appts.filter((a) => weekdayOf(a.date) === d).length }));
  const status = (["pending", "approved", "completed", "cancelled", "rejected"] as const).map((s) => ({ name: s[0].toUpperCase() + s.slice(1), value: appts.filter((a) => a.status === s).length }));
  const doctorStats = data.doctors.filter((d) => doc === "all" || d.id === doc).map((d) => {
    const l = appts.filter((a) => a.doctorId === d.id);
    return { name: d.name, specialization: d.specialization, total: l.length, completed: l.filter((a) => a.status === "completed").length, cancelled: l.filter((a) => a.status === "cancelled" || a.status === "rejected").length };
  });
  const pct = (n: number) => (k.total ? `${Math.round((n / k.total) * 100)}%` : "0%");
  const grid = <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />;

  const exportCsv = (name: string, rows: Record<string, string | number>[]) => {
    if (!rows.length) { toast("info", "Nothing to export", "No data for the selected filters."); return; }
    downloadCsv(`medivance-${name}-${from}_to_${to}.csv`, rows); toast("success", "CSV exported", name);
  };

  return (
    <>
      <PageHeader title="Reports & analytics" subtitle="Filter by date and doctor, then export any report to CSV."
        actions={<div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={() => exportCsv("appointments", appts.map((a) => ({ Reference: a.ref, Patient: patientById(a.patientId)?.name ?? "Removed", Doctor: doctorById(a.doctorId)?.name ?? "Removed", Date: a.date, Time: fmtTime(a.time), Status: a.status, Reason: a.reason })))}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Appointments</span></button>
          <button className="btn-ghost btn-sm" onClick={() => exportCsv("patients", data.patients.map((p) => ({ Name: p.name, Email: p.email, Phone: p.phone, Gender: p.gender, Registered: p.registeredAt.slice(0, 10), "Appointments in range": appts.filter((a) => a.patientId === p.id).length })))}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Patients</span></button>
          <button className="btn-ghost btn-sm" onClick={() => exportCsv("doctors", doctorStats.map((d) => ({ Doctor: d.name, Specialization: d.specialization, Total: d.total, Completed: d.completed, Cancelled: d.cancelled })))}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Doctors</span></button>
          <button className="btn-ghost btn-sm" onClick={() => exportCsv("status", status.map((s) => ({ Status: s.name, Count: s.value, Share: pct(s.value) })))}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Status</span></button>
        </div>} />
      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-3">        <div><label className="label" htmlFor="r-f">From</label><input id="r-f" type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="label" htmlFor="r-t">To</label><input id="r-t" type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
        <div><label className="label" htmlFor="r-d">Doctor</label><select id="r-d" className="input" value={doc} onChange={(e) => setDoc(e.target.value)}><option value="all">All doctors</option>{data.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Appointments" value={k.total} icon={CalendarCheck} />
        <StatCard label={`Completed (${pct(k.completed)})`} value={k.completed} icon={CheckCircle2} tone="ok" />
        <StatCard label={`Cancelled (${pct(k.cancelled + k.rejected)})`} value={k.cancelled + k.rejected} icon={XCircle} tone="bad" />
        <StatCard label={`New patients - ${activePatients} active`} value={newPatients.length} icon={UserPlus} tone="accent" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly trend" subtitle="Total vs completed appointments">
          <LineChart data={monthly}>{grid}<XAxis dataKey="name" stroke={c.axis} tickLine={false} fontSize={11} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={30} /><Tooltip contentStyle={tt} /><Legend wrapperStyle={{ color: c.axis, fontSize: 11 }} />
            <Line type="monotone" dataKey="total" name="Total" stroke={c.series[0]} strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="completed" name="Completed" stroke={c.series[4]} strokeWidth={2.5} dot={{ r: 3 }} /></LineChart>
        </ChartCard>
        <ChartCard title="Status report" subtitle="Share of each appointment status">
          <PieChart><Pie data={status.filter((s) => s.value > 0)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">{status.filter((s) => s.value > 0).map((_, i) => <Cell key={i} fill={c.series[i % c.series.length]} />)}</Pie><Tooltip contentStyle={tt} /><Legend wrapperStyle={{ color: c.axis, fontSize: 11 }} /></PieChart>
        </ChartCard>
        <ChartCard title="Weekly pattern" subtitle="Appointments by weekday">
          <AreaChart data={weekly}><defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c.series[3]} stopOpacity={0.55} /><stop offset="95%" stopColor={c.series[3]} stopOpacity={0} /></linearGradient></defs>{grid}<XAxis dataKey="name" stroke={c.axis} tickLine={false} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={30} /><Tooltip contentStyle={tt} /><Area type="monotone" dataKey="appointments" stroke={c.series[3]} strokeWidth={2.5} fill="url(#rw)" /></AreaChart>
        </ChartCard>
        <ChartCard title="Completed vs cancelled" subtitle="Monthly outcome comparison">
          <BarChart data={monthly}>{grid}<XAxis dataKey="name" stroke={c.axis} tickLine={false} fontSize={11} /><YAxis allowDecimals={false} stroke={c.axis} tickLine={false} width={30} /><Tooltip contentStyle={tt} cursor={{ fill: "rgba(120,120,255,.08)" }} /><Legend wrapperStyle={{ color: c.axis, fontSize: 11 }} />
            <Bar dataKey="completed" name="Completed" fill={c.series[4]} radius={[6, 6, 0, 0]} /><Bar dataKey="cancelled" name="Cancelled" fill={c.series[5]} radius={[6, 6, 0, 0]} /></BarChart>
        </ChartCard>
      </div>
      <div className="card table-wrap mt-5">
        <div className="px-5 pt-4 font-bold">Doctor statistics</div>
        <table className="table"><thead><tr><th>Doctor</th><th>Specialization</th><th>Total</th><th>Completed</th><th>Cancelled</th></tr></thead>
          <tbody>{doctorStats.sort((a, b) => b.total - a.total).map((d) => <tr key={d.name}><td className="font-semibold">{d.name}</td><td>{d.specialization}</td><td>{d.total}</td><td>{d.completed}</td><td>{d.cancelled}</td></tr>)}</tbody></table>
      </div>
      <p className="mt-3 text-xs text-muted">Range: {fmtDate(from)} - {fmtDate(to)}. Data comes from the LocalStorage demo database.</p>
    </>
  );
}
