"use client";
import Link from "next/link";
import { useState } from "react";
import { BellPlus, CalendarClock, CalendarDays, CalendarPlus, Clock, Download, Hash, Receipt, Sparkles, XCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import ReceiptModal from "@/components/appointments/ReceiptModal";
import { useApp } from "@/hooks/useApp";
import { Appointment, Doctor } from "@/types";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";
import { isPassedSlot } from "@/lib/utilities/appointments";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";

export default function AppointmentCard({
  a,
  doctor,
  onCancel,
  onReschedule,
}: {
  a: Appointment;
  doctor?: Doctor;
  onCancel?: (a: Appointment) => void;
  onReschedule?: (a: Appointment) => void;
}) {
  const [remind, setRemind] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const { data } = useApp();
  const pay = data.payments.find((x) => x.appointmentId === a.id && x.status === "paid");
  const lastMove = data.reschedules.find((x) => x.appointmentId === a.id); // newest first
  const isPassed = isPassedSlot(a);
  const canCancel = !!onCancel && ["pending", "approved"].includes(a.status) && !isPassed && a.date >= todayISO();
  const canRemind = ["pending", "approved"].includes(a.status) && !isPassed && a.date >= todayISO();
  const canReceipt = ["pending", "approved", "completed"].includes(a.status) || isPassed;
  const canReschedulePassed = isPassed && !!onReschedule;

  return (
    <article className="card card-hover p-4">
      <div className="flex items-start gap-3">
        {(() => {
          const pic = doctor?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.photo} alt={doctor.name} className="h-20 w-16 shrink-0 rounded-2xl object-cover object-top ring-2 ring-primary/30" />
          ) : <Avatar name={doctor?.name ?? "Removed Doctor"} size={64} />;
          return doctor && onCancel ? <Link href={`/patient/doctors/${doctor.id}`} aria-label={`View ${doctor.name}'s profile`} className="shrink-0">{pic}</Link> : pic;
        })()}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate font-display font-bold">{doctor?.name ?? "Doctor no longer available"}</h3>
            <span className="flex items-center gap-1.5 flex-wrap">
              {isPassed && <span className="badge border-amber-400/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px]">SLOT PASSED</span>}
              {pay && <span className="badge badge-approved" title={`Transaction ${pay.transactionId} (simulated)`}>PAID</span>}
              <StatusBadge status={a.status} />
            </span>
          </div>
          <p className="text-xs text-muted">{doctor?.specialization ?? "-"}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-1.5"><Hash className="h-4 w-4 text-primary" /><dd className="font-semibold">{a.ref}</dd></div>
        <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /><dd>{fmtDate(a.date)}</dd></div>
        <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /><dd>{fmtTime(a.time)}</dd></div>
      </dl>
      <p className="mt-2 line-clamp-2 text-xs text-muted">Reason: {a.reason}</p>
      {isPassed && (
        <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>This slot elapsed. You can reschedule to any upcoming date without making a payment.</span>
        </div>
      )}
      {lastMove && <p className="mt-1 rounded-lg bg-warn/10 px-2 py-1 text-xs text-warn">Rescheduled from {fmtDate(lastMove.oldDate)} {fmtTime(lastMove.oldTime)}.{lastMove.reason ? ` Reason: ${lastMove.reason}` : ""}{pay ? " Your payment is unchanged." : ""}</p>}

      {(canReschedulePassed || canCancel || canRemind || canReceipt) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canReschedulePassed && (
            <button
              type="button"
              onClick={() => onReschedule!(a)}
              className="btn btn-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 shadow-sm inline-flex items-center gap-1.5 text-xs font-semibold"
              title="Reschedule your missed slot with zero payment"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Reschedule Passed Slot (Fee Waived)</span>
            </button>
          )}
          {canRemind && (
            <div className="relative">
              <button onClick={() => setRemind((v) => !v)} className="btn-ghost btn-sm" aria-expanded={remind} aria-haspopup="menu"><BellPlus className="h-4 w-4" /> Remind me</button>
              {remind && (
                <div role="menu" className="card absolute bottom-full start-0 z-20 mb-2 w-56 animate-pop !bg-surface p-1.5 shadow-soft">
                  <a role="menuitem" href={googleCalendarUrl(a, doctor)} target="_blank" rel="noreferrer" onClick={() => setRemind(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"><CalendarPlus className="h-4 w-4 text-primary" /> Add to Google Calendar</a>
                  <button role="menuitem" onClick={() => { downloadIcs(a, doctor); setRemind(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"><Download className="h-4 w-4 text-primary" /> Download calendar file (.ics)</button>
                </div>
              )}
            </div>
          )}
          {canReceipt && <button onClick={() => setReceipt(true)} className="btn-ghost btn-sm"><Receipt className="h-4 w-4" /> Receipt</button>}
          {canCancel && <button onClick={() => onCancel!(a)} className="btn-ghost btn-sm !border-bad/40 text-bad hover:!bg-bad/10"><XCircle className="h-4 w-4" /> Cancel appointment</button>}
        </div>
      )}
      {canReceipt && <ReceiptModal a={a} doctor={doctor} open={receipt} onClose={() => setReceipt(false)} />}
    </article>
  );
}
