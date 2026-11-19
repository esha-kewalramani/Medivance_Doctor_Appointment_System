"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, CheckCheck, Search, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import RescheduleModal from "@/components/appointments/RescheduleModal";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";
import { Appointment, AppointmentStatus } from "@/types";

const FILTERS: ("all" | AppointmentStatus)[] = ["all", "pending", "approved", "completed", "rejected", "cancelled"];

export default function DoctorAppointmentsPage() {
  const { data, session, patientById, setStatus } = useApp();
  const [moveId, setMoveId] = useState<string | null>(null);
  const moving = data.appointments.find((x) => x.id === moveId);
  const isPaid = (id: string) => data.payments.some((x) => x.appointmentId === id && x.status === "paid");
  const qp = useQueryParam("q");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  useEffect(() => { if (qp) setQ(qp); }, [qp]);

  const mine = useMemo(() => data.appointments.filter((a) => a.doctorId === session?.userId), [data.appointments, session]);
  const rows = mine
    .filter((a) => (filter === "all" || a.status === filter) && (!q || `${a.ref} ${patientById(a.patientId)?.name ?? ""} ${a.reason}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.status === "pending" && b.status !== "pending" ? -1 : b.status === "pending" && a.status !== "pending" ? 1 : a.date + a.time < b.date + b.time ? 1 : -1));

  const act = async (a: Appointment, status: AppointmentStatus) => {
    const p = patientById(a.patientId)?.name ?? "the patient";
    const label = { approved: "Approve", rejected: "Reject", completed: "Mark as completed" }[status as "approved"] ?? status;
    const ok = await confirmDialog(`${label} this appointment?`, `${p} - ${fmtDate(a.date)} at ${fmtTime(a.time)} (${a.ref})`, `Yes, ${label.toLowerCase()}`, status === "rejected");
    if (!ok) return;
    const r = setStatus(a.id, status);
    if (!r.ok) toast("error", "Action failed", r.error);
    else toast("success", `Appointment ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "completed"}`, `${a.ref} for ${p}`);
  };

  return (
    <>
      <PageHeader title="Appointment requests" subtitle="Approve, reject or complete appointments. Approved slots stay blocked; rejected slots are released." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm capitalize ${filter === f ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}>{f}{f !== "all" && <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{mine.filter((a) => a.status === f).length}</span>}</button>)}</div>
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search patient or reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" /></div>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? <EmptyState title="No appointments found" text="Requests from patients will appear here." /> : (
          <table className="table">
            <thead><tr><th>Patient</th><th>Reference</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">
                  {a.isGuest ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{a.guestDetails?.name || patientById(a.patientId)?.name || "Guest"}</span>
                        <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px] py-0 px-1.5">Guest</span>
                      </div>
                      <p className="text-xs font-normal text-muted">{a.guestDetails?.phone || a.guestDetails?.email}</p>
                    </div>
                  ) : (
                    <div>
                      <span>{patientById(a.patientId)?.name ?? "Removed patient"}</span>
                      {patientById(a.patientId)?.phone && <p className="text-xs font-normal text-muted">{patientById(a.patientId)?.phone}</p>}
                    </div>
                  )}
                </td>
                <td>{a.ref}</td><td>{fmtDate(a.date)}</td><td>{fmtTime(a.time)}</td>
                <td className="max-w-[220px] truncate" title={a.reason}>{a.reason}</td><td><span className="flex flex-wrap items-center gap-1.5"><StatusBadge status={a.status} />{isPaid(a.id) && <span className="badge badge-approved">PAID</span>}</span></td>
                <td><div className="flex justify-end gap-1.5">
                  {a.status === "pending" && <><button className="btn-primary btn-sm" onClick={() => act(a, "approved")}><Check className="h-4 w-4" /> Approve</button><button className="btn-danger btn-sm" onClick={() => act(a, "rejected")}><X className="h-4 w-4" /> Reject</button></>}
                  {a.status === "approved" && a.date <= todayISO() && <button className="btn-ghost btn-sm" onClick={() => act(a, "completed")}><CheckCheck className="h-4 w-4" /> Complete</button>}
                  {(a.status === "pending" || a.status === "approved") && <button className="btn-ghost btn-sm" onClick={() => setMoveId(a.id)}><CalendarClock className="h-4 w-4" /> Reschedule</button>}
                </div></td>
              </tr>))}</tbody>
          </table>)}
      </div>
      {moving && <RescheduleModal key={moving.id} a={moving} open onClose={() => setMoveId(null)} />}
    </>
  );
}
