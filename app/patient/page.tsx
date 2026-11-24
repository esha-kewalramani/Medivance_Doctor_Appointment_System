"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Bot, CalendarCheck, CalendarClock, CalendarX2, CheckCircle2, Mail, Phone, Droplets, Pill, FileText, ShieldCheck, ShieldAlert, Sparkles, Printer } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HealthSummary from "@/components/dashboard/HealthSummary";
import Countdown from "@/components/appointments/Countdown";
import ChartCard from "@/components/charts/ChartCard";
import { useChartColors } from "@/components/charts/useChartColors";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import PatientLiveQueueCard from "@/components/queue/PatientLiveQueueCard";
import HospitalArrivalCheckIn from "@/components/queue/HospitalArrivalCheckIn";
import AutomatedRemindersCard from "@/components/notifications/AutomatedRemindersCard";
import EarlierSlotOfferCard from "@/components/notifications/EarlierSlotOfferCard";
import PrescriptionViewModal from "@/components/prescriptions/PrescriptionViewModal";
import { Prescription } from "@/types";
import { useApp } from "@/hooks/useApp";
import { addDays, fmtDate, fmtTime, parseISO, timeAgo, todayISO } from "@/lib/utilities";

export default function PatientDashboard() {
  const { data, session, user, doctorById, toggleAuraConsent } = useApp();
  const c = useChartColors();
  const me = data.patients.find((p) => p.id === session?.userId);
  const mine = useMemo(() => data.appointments.filter((a) => a.patientId === session?.userId), [data.appointments, session]);
  const myAppointmentIds = useMemo(() => new Set(mine.map((a) => a.id)), [mine]);
  const myPrescriptions = useMemo(
    () =>
      (data.prescriptions || []).filter(
        (p) =>
          p.patientId === session?.userId ||
          (p.appointmentId && myAppointmentIds.has(p.appointmentId))
      ),
    [data.prescriptions, session, myAppointmentIds]
  );
  const myRecords = useMemo(
    () =>
      (data.medicalRecords || []).filter(
        (m) =>
          m.patientId === session?.userId ||
          (m.appointmentId && myAppointmentIds.has(m.appointmentId))
      ),
    [data.medicalRecords, session, myAppointmentIds]
  );
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

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

  const auraConsented = Boolean(me?.auraConsent);

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

      {/* 1-Click Fast-Track GPS Reception Check-In */}
      {/* Earlier Vacated Slot Promotion Card (Triggered when someone cancels an earlier slot) */}
      <EarlierSlotOfferCard />

      <HospitalArrivalCheckIn />

      {/* Real-Time Live Queue & Token Tracker */}
      <PatientLiveQueueCard />

      {/* Prominent Recent Digital Prescription Notice (if issued by doctor) */}
      {myPrescriptions.length > 0 && (
        <section className="card border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:border dark:border-emerald-400/40 dark:text-emerald-300">
                <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Doctor&apos;s Digital Prescription Issued
                  </h3>
                  <span className="badge border-emerald-400/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                    {myPrescriptions[0].rxNumber || "VERIFIED RX"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Issued by <strong>{myPrescriptions[0].doctorName}</strong> on {fmtDate(myPrescriptions[0].date)} • {myPrescriptions[0].medications.length} medication{myPrescriptions[0].medications.length > 1 ? "s" : ""} prescribed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRx(myPrescriptions[0])}
                className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm inline-flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> View Digital Rx &amp; QR Slip
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Automated Email & 1-Click WhatsApp Reminders Notification Monitor */}
      <AutomatedRemindersCard />

      {/* Aura AI Consent & Privacy Card */}
      <section className="card border-primary/20 bg-surface-2/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base">Aura AI Personalized Health Assistant</h3>
                {auraConsented ? (
                  <span className="badge border-ok/30 bg-ok/10 text-ok text-xs inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Consent Active
                  </span>
                ) : (
                  <span className="badge border-muted/30 bg-muted/10 text-muted text-xs inline-flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Consent Inactive
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted leading-relaxed max-w-2xl">
                Strict privacy control: Aura AI can securely access your previous consultation records and prescriptions only when you grant explicit consent.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => session && toggleAuraConsent(session.userId, !auraConsented)}
              className={`btn btn-sm ${auraConsented ? "btn-danger" : "btn-primary"} !rounded-lg text-xs`}
            >
              {auraConsented ? "Revoke Access" : "Enable Aura AI Access"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total appointments" value={mine.length} icon={CalendarCheck} />
        <StatCard label="Upcoming" value={upcoming.length} icon={CalendarClock} tone="warn" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="ok" />
        <StatCard label="Cancelled" value={cancelled} icon={CalendarX2} tone="bad" />
      </div>

      <HealthSummary />

      {/* Prescriptions & Medical Records Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Prescriptions */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" /> My Prescriptions ({myPrescriptions.length})
            </h2>
            <Link href="/patient/assistant" className="text-xs text-primary hover:underline">Ask Aura about meds</Link>
          </div>
          {myPrescriptions.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No prescriptions on record yet.</p>
          ) : (
            <div className="space-y-3">
              {myPrescriptions.map((p) => (
                <div key={p.id} className="rounded-xl border border-line/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-fg">{p.doctorName}</span>
                    <span className="text-muted">{fmtDate(p.date)}</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {p.medications.map((m, idx) => (
                      <li key={idx} className="flex items-center justify-between border-b border-line/30 py-1 last:border-0">
                        <span className="font-medium text-primary">{m.name} <span className="text-fg font-normal">({m.dosage})</span></span>
                        <span className="text-muted">{m.frequency} • {m.duration}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/40">
                    {p.instructions ? (
                      <p className="text-xs text-muted truncate max-w-[200px] sm:max-w-[260px]">
                        <b className="text-fg">Advice:</b> {p.instructions}
                      </p>
                    ) : <span />}
                    <button
                      type="button"
                      onClick={() => setSelectedRx(p)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-teal-600 dark:hover:text-cyan-300 transition-colors px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20"
                    >
                      <Printer className="h-3.5 w-3.5" /> Official Slip & QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Clinical Records */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Consultation Records ({myRecords.length})
            </h2>
            <Link href="/patient/assistant" className="text-xs text-primary hover:underline">Explain reports</Link>
          </div>
          {myRecords.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No consultation records on file yet.</p>
          ) : (
            <div className="space-y-3">
              {myRecords.map((r) => (
                <div key={r.id} className="rounded-xl border border-line/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-fg">{r.diagnosis}</span>
                    <span className="text-muted">{fmtDate(r.date)} • {r.doctorName}</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{r.clinicalNotes}</p>
                  {r.vitals && (
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {r.vitals.bloodPressure && <span className="badge border-line/50">BP: {r.vitals.bloodPressure}</span>}
                      {r.vitals.heartRate && <span className="badge border-line/50">HR: {r.vitals.heartRate}</span>}
                      {r.vitals.weight && <span className="badge border-line/50">Weight: {r.vitals.weight}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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

      {/* Official Prescription View & QR Verification Slip Modal */}
      {selectedRx && (
        <PrescriptionViewModal
          open={Boolean(selectedRx)}
          prescription={selectedRx}
          patientName={user?.name || "Patient"}
          onClose={() => setSelectedRx(null)}
        />
      )}
    </div>
  );
}
