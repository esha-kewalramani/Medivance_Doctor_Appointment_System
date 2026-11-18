"use client";
import { useEffect, useMemo, useState } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { toast } from "@/components/notifications/alerts";
import { fmtDate, fmtTime, money } from "@/lib/utilities";
import { AppointmentStatus } from "@/types";

const STATUSES: AppointmentStatus[] = ["pending", "approved", "completed", "rejected", "cancelled"];

export default function AdminAppointmentsPage() {
  const { data, doctorById, patientById, setStatus } = useApp();
  const qp = useQueryParam("q");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState("all");
  const [patient, setPatient] = useState("all");
  const [status, setSt] = useState("all");
  const [viewId, setViewId] = useState<string | null>(null);
  useEffect(() => { if (qp) setQ(qp); }, [qp]);
  const text = q.toLowerCase();

  const rows = useMemo(() => data.appointments
    .filter((a) => (!date || a.date === date) && (doctor === "all" || a.doctorId === doctor) && (patient === "all" || a.patientId === patient) && (status === "all" || a.status === status)
      && (!text || `${a.ref} ${a.reason} ${doctorById(a.doctorId)?.name ?? ""} ${patientById(a.patientId)?.name ?? ""}`.toLowerCase().includes(text)))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)), [data.appointments, date, doctor, patient, status, text, doctorById, patientById]);
  const view = data.appointments.find((a) => a.id === viewId);
  const reset = () => { setQ(""); setDate(""); setDoctor("all"); setPatient("all"); setSt("all"); };

  const change = (id: string, s: AppointmentStatus) => { const r = setStatus(id, s); if (!r.ok) toast("error", "Status not changed", r.error); else toast("success", "Status updated", `Appointment marked as ${s}.`); };

  return (
    <>
      <PageHeader title="All appointments" subtitle={`${rows.length} of ${data.appointments.length} appointments shown`} />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 xl:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search reference, patient, doctor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" /></div>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        <select className="input" value={doctor} onChange={(e) => setDoctor(e.target.value)} aria-label="Filter by doctor"><option value="all">All doctors</option>{data.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select className="input" value={patient} onChange={(e) => setPatient(e.target.value)} aria-label="Filter by patient"><option value="all">All patients</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex gap-2"><select className="input flex-1" value={status} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
          <button className="btn-ghost shrink-0" onClick={reset} aria-label="Reset filters"><RotateCcw className="h-4 w-4" /></button></div>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? <EmptyState title="No appointments match" text="Adjust or reset the filters." /> : (
          <table className="table">
            <thead><tr><th>Reference</th><th>Patient</th><th>Doctor</th><th>Date & time</th><th>Status</th><th>Manage</th><th /></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">{a.ref}</td><td>{patientById(a.patientId)?.name ?? "Removed"}</td><td>{doctorById(a.doctorId)?.name ?? "Removed"}</td>
                <td>{fmtDate(a.date)}<div className="text-xs text-muted">{fmtTime(a.time)}</div></td><td><StatusBadge status={a.status} /></td>
                <td><select className="input !py-1.5 text-xs capitalize" value={a.status} onChange={(e) => change(a.id, e.target.value as AppointmentStatus)} aria-label={`Change status of ${a.ref}`}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                <td><button className="btn-ghost btn-sm" onClick={() => setViewId(a.id)} aria-label={`View ${a.ref}`}><Eye className="h-4 w-4" /></button></td>
              </tr>))}</tbody>
          </table>)}
      </div>
      <Modal open={!!view} onClose={() => setViewId(null)} title="Appointment details">
        {view && (() => { const d = doctorById(view.doctorId); const p = patientById(view.patientId); return (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[["Reference", view.ref], ["Status", ""], ["Patient", p ? `${p.name} (${p.phone})` : "Removed"], ["Doctor", d ? `${d.name} - ${d.specialization}` : "Removed"], ["Date", fmtDate(view.date)], ["Time", fmtTime(view.time)], ["Fee", d ? money(d.fee) : "-"], ["Booked on", fmtDate(view.createdAt.slice(0, 10))]].map(([k, v]) => (
              <div key={k}><dt className="text-xs uppercase text-muted">{k}</dt><dd className="font-semibold">{k === "Status" ? <StatusBadge status={view.status} /> : v}</dd></div>))}
            <div className="sm:col-span-2"><dt className="text-xs uppercase text-muted">Reason for visit</dt><dd className="font-semibold">{view.reason}</dd></div>
          </dl>); })()}
      </Modal>
    </>
  );
}
