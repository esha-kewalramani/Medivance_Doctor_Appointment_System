"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, CheckCheck, FileText, Pill, Search, Sparkles, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import RescheduleModal from "@/components/appointments/RescheduleModal";
import DoctorPrescriptionModal from "@/components/prescriptions/DoctorPrescriptionModal";
import PrescriptionViewModal from "@/components/prescriptions/PrescriptionViewModal";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";
import { Appointment, AppointmentStatus, Prescription, TriageBrief } from "@/types";

const FILTERS: ("all" | AppointmentStatus)[] = ["all", "approved", "completed", "pending", "rejected", "cancelled"];

export default function DoctorAppointmentsPage() {
  const { data, session, user, patientById, setStatus } = useApp();
  const [moveId, setMoveId] = useState<string | null>(null);
  const moving = data.appointments.find((x) => x.id === moveId);
  const isPaid = (id: string) => data.payments.some((x) => x.appointmentId === id && x.status === "paid");
  const qp = useQueryParam("q");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  useEffect(() => { if (qp) setQ(qp); }, [qp]);

  const [viewingSoap, setViewingSoap] = useState<{ brief: TriageBrief; patientName: string; ref: string } | null>(null);
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);
  const [writingRxAppt, setWritingRxAppt] = useState<Appointment | null>(null);

  const mine = useMemo(() => data.appointments.filter((a) => a.doctorId === session?.userId), [data.appointments, session]);
  const rows = mine
    .filter((a) => (filter === "all" || a.status === filter) && (!q || `${a.ref} ${a.guestDetails?.name ?? patientById(a.patientId)?.name ?? ""} ${a.reason}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.status === "pending" && b.status !== "pending" ? -1 : b.status === "pending" && a.status !== "pending" ? 1 : a.date + a.time < b.date + b.time ? 1 : -1));

  const getPrescriptionFor = (a: Appointment) => {
    return (data.prescriptions || []).find(
      (p) => p.appointmentId === a.id || (p.patientId === a.patientId && p.doctorId === a.doctorId && p.date === a.date)
    );
  };

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
      <PageHeader title="Appointments" subtitle="All booked slots are automatically confirmed. Review scheduled visits, AI clinical SOAP notes, prescriptions, or complete consultations." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm capitalize ${filter === f ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}>{f}{f !== "all" && <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{mine.filter((a) => a.status === f).length}</span>}</button>)}</div>
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search patient or reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" /></div>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? <EmptyState title="No appointments found" text="Requests from patients will appear here." /> : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Reference</th>
                <th>Date &amp; Time</th>
                <th>Clinical Reason / SOAP</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>{rows.map((a) => {
              const patientName = a.guestDetails?.name || patientById(a.patientId)?.name || "Patient";
              const rx = getPrescriptionFor(a);
              const soap = a.triageBrief || (a.soapNote ? {
                appointmentId: a.id,
                patientId: a.patientId,
                symptoms: [a.reason],
                chiefComplaint: a.reason,
                duration: "2-3 Days",
                painScale: 4,
                allergies: "NKDA",
                currentMedications: "None reported",
                urgency: "routine" as const,
                soapNote: a.soapNote,
                submittedAt: a.createdAt,
              } : null);

              return (
                <tr key={a.id}>
                  <td className="font-semibold">
                    {a.isGuest ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{patientName}</span>
                          <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px] py-0 px-1.5">Guest</span>
                        </div>
                        <p className="text-xs font-normal text-muted">{a.guestDetails?.phone || a.guestDetails?.email}</p>
                      </div>
                    ) : (
                      <div>
                        <span>{patientName}</span>
                        {patientById(a.patientId)?.phone && <p className="text-xs font-normal text-muted">{patientById(a.patientId)?.phone}</p>}
                      </div>
                    )}
                  </td>
                  <td className="font-mono text-xs">{a.ref}</td>
                  <td>
                    <span className="font-medium">{fmtDate(a.date)}</span>
                    <p className="text-xs text-muted">{fmtTime(a.time)}</p>
                  </td>
                  <td className="max-w-[260px]">
                    <p className="truncate text-xs font-medium" title={a.reason}>{a.reason}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {soap && (
                        <button
                          type="button"
                          onClick={() => setViewingSoap({ brief: soap, patientName, ref: a.ref })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-100 text-teal-800 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:hover:bg-cyan-500/30 transition shadow-xs"
                          title="Click to view full Aura AI clinical SOAP note"
                        >
                          <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                          <span>SOAP Ready</span>
                        </button>
                      )}
                      {rx ? (
                        <button
                          type="button"
                          onClick={() => setViewingRx(rx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 transition"
                          title="Click to view doctor's official digital prescription"
                        >
                          <Pill className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Rx Issued</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWritingRxAppt(a)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          title="Write prescription for this patient"
                        >
                          <FileText className="h-3 w-3" />
                          <span>+ Write Rx</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={a.status} />
                      {isPaid(a.id) && <span className="badge badge-approved text-[10px]">PAID</span>}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {soap && (
                        <button
                          type="button"
                          onClick={() => setViewingSoap({ brief: soap, patientName, ref: a.ref })}
                          className="btn-ghost btn-sm text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30"
                          title="View complete clinical SOAP note"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                          <span>SOAP</span>
                        </button>
                      )}
                      {rx ? (
                        <button
                          type="button"
                          onClick={() => setViewingRx(rx)}
                          className="btn-ghost btn-sm text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                          title="View official prescription"
                        >
                          <Pill className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Rx</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWritingRxAppt(a)}
                          className="btn-ghost btn-sm text-primary"
                          title="Write prescription"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Rx</span>
                        </button>
                      )}
                      {a.status === "pending" && (
                        <>
                          <button className="btn-primary btn-sm" onClick={() => act(a, "approved")}><Check className="h-4 w-4" /> Approve</button>
                          <button className="btn-danger btn-sm" onClick={() => act(a, "rejected")}><X className="h-4 w-4" /> Reject</button>
                        </>
                      )}
                      {a.status === "approved" && a.date <= todayISO() && (
                        <button className="btn-ghost btn-sm text-emerald-600 dark:text-emerald-400" onClick={() => act(a, "completed")}>
                          <CheckCheck className="h-4 w-4" /> Complete
                        </button>
                      )}
                      {(a.status === "pending" || a.status === "approved") && (
                        <button className="btn-ghost btn-sm" onClick={() => setMoveId(a.id)}>
                          <CalendarClock className="h-4 w-4" /> Reschedule
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>

      {moving && <RescheduleModal key={moving.id} a={moving} open onClose={() => setMoveId(null)} />}

      {/* Clinical AI SOAP Note Modal */}
      {viewingSoap && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingSoap(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-cyan-500/40 dark:bg-[#06152b] dark:text-slate-100 max-h-[90vh] overflow-y-auto animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-100 text-teal-700 dark:bg-cyan-950/80 dark:border dark:border-cyan-400/40 dark:text-cyan-300">
                  <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Aura AI Clinical SOAP Note
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Patient: <strong className="text-teal-700 dark:text-cyan-400">{viewingSoap.patientName}</strong> • Ref: {viewingSoap.ref}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSoap(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#041024] border border-slate-200 dark:border-cyan-500/20">
                <span className="text-slate-500 dark:text-slate-400">Triage Urgency:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                    viewingSoap.brief.urgency === "urgent"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                      : viewingSoap.brief.urgency === "moderate"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  {viewingSoap.brief.urgency} priority (Pain: {viewingSoap.brief.painScale}/10)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 dark:border-cyan-500/20 dark:bg-[#040f21]/70">
                <strong className="text-teal-700 dark:text-cyan-400 block mb-1">S (Subjective):</strong>
                <p className="text-slate-700 dark:text-slate-300">{viewingSoap.brief.soapNote.subjective}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Symptoms: {viewingSoap.brief.symptoms.join(", ")} • Duration: {viewingSoap.brief.duration}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 dark:border-cyan-500/20 dark:bg-[#040f21]/70">
                <strong className="text-teal-700 dark:text-cyan-400 block mb-1">O (Objective):</strong>
                <p className="text-slate-700 dark:text-slate-300">{viewingSoap.brief.soapNote.objective}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Allergies: {viewingSoap.brief.allergies} • Ongoing Meds: {viewingSoap.brief.currentMedications}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 dark:border-cyan-500/20 dark:bg-[#040f21]/70">
                <strong className="text-teal-700 dark:text-cyan-400 block mb-1">A (Assessment):</strong>
                <p className="text-slate-700 dark:text-slate-300">{viewingSoap.brief.soapNote.assessment}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 dark:border-cyan-500/20 dark:bg-[#040f21]/70">
                <strong className="text-teal-700 dark:text-cyan-400 block mb-1">P (Plan):</strong>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{viewingSoap.brief.soapNote.plan}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-cyan-500/20">
              <button
                type="button"
                onClick={() => setViewingSoap(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-[#071d38] border border-slate-200 dark:border-cyan-500/30 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Close SOAP Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Prescription Modal */}
      {writingRxAppt && (
        <DoctorPrescriptionModal
          patientId={writingRxAppt.patientId}
          patientName={writingRxAppt.guestDetails?.name || patientById(writingRxAppt.patientId)?.name || "Patient"}
          doctorId={writingRxAppt.doctorId}
          doctorName={user?.name || "Dr. Specialist"}
          open={Boolean(writingRxAppt)}
          onClose={() => setWritingRxAppt(null)}
          onSuccess={(rx) => {
            setWritingRxAppt(null);
            setViewingRx(rx);
          }}
        />
      )}

      {/* View Digital Prescription Modal */}
      {viewingRx && (
        <PrescriptionViewModal
          prescription={viewingRx}
          open={Boolean(viewingRx)}
          onClose={() => setViewingRx(null)}
        />
      )}
    </>
  );
}
