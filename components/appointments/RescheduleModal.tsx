"use client";
import { useMemo, useState } from "react";
import { CalendarClock, Clock, History } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/hooks/useApp";
import { addDays, fmtDate, fmtTime, todayISO, weekdayOf } from "@/lib/utilities";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { Appointment } from "@/types";

/** Doctor-initiated rescheduling. The database re-checks everything (ownership, availability, conflicts, status) and keeps the history. */
export default function RescheduleModal({ a, open, onClose }: { a: Appointment; open: boolean; onClose: () => void }) {
  const { data, doctorById, patientById, getSlots, rescheduleAppointment } = useApp();
  const doctor = doctorById(a.doctorId);
  const patient = patientById(a.patientId);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(todayISO(), i)), []);
  const pay = data.payments.find((x) => x.appointmentId === a.id && x.status === "paid");
  const history = data.reschedules.filter((x) => x.appointmentId === a.id);
  const slots = date ? getSlots(a.doctorId, date) : [];
  const freeCount = (d: string) => getSlots(a.doctorId, d).filter((s) => s.state === "free").length;
  const isCurrent = (d: string, t: string) => d === a.date && t === a.time;

  const close = () => { if (busy) return; setDate(""); setTime(""); setReason(""); onClose(); };

  const submit = async () => {
    if (busy || !date || !time) return;
    const ok = await confirmDialog("Reschedule this appointment?", `${patient?.name ?? "The patient"}: ${fmtDate(a.date)} ${fmtTime(a.time)}  ->  ${fmtDate(date)} ${fmtTime(time)}. The patient will be notified.`, "Yes, reschedule");
    if (!ok) return;
    setBusy(true);
    const r = await rescheduleAppointment(a.id, date, time, reason);
    setBusy(false);
    if (!r.ok) { toast("error", "Could not reschedule", r.error); if (r.code === "23505") setTime(""); return; }
    toast("success", "Appointment rescheduled", `${a.ref} is now on ${fmtDate(date)} at ${fmtTime(time)}.`);
    setDate(""); setTime(""); setReason(""); onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Reschedule appointment" wide>
      <div className="space-y-4">
        <div className="rounded-xl border border-line/50 bg-primary/5 p-3 text-sm">
          <p className="font-semibold">{patient?.name ?? "Patient"} <span className="font-normal text-muted">- {a.ref}</span></p>
          <p className="text-muted">Currently {fmtDate(a.date)} at {fmtTime(a.time)} with {doctor?.name ?? "you"}</p>
          {pay && <p className="mt-1 text-xs text-ok">This appointment is already PAID ({pay.transactionId}). The patient will not be charged again and the receipt stays valid.</p>}
        </div>

        <div>
          <h4 className="mb-2 font-display font-semibold">1. Choose a new date</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const works = !!doctor?.availability.some((w) => w.day === weekdayOf(d));
              const free = works ? freeCount(d) : 0;
              const dt = new Date(d + "T00:00:00");
              return (
                <button key={d} disabled={!free} onClick={() => { setDate(d); setTime(""); }} aria-pressed={date === d}
                  className={`flex w-[72px] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${date === d ? "border-primary bg-primary text-primary-fg shadow-glow" : "border-line/60 hover:border-primary"}`}>
                  <span className="text-[11px] uppercase">{weekdayOf(d)}</span><span className="font-display text-xl font-bold">{dt.getDate()}</span>
                  <span className="text-[10px]">{dt.toLocaleString("en", { month: "short" })}</span>
                  <span className={`mt-1 text-[10px] ${date === d ? "" : free ? "text-ok" : "text-muted"}`}>{free ? `${free} free` : works ? "Full" : "Off"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {date && (
          <div className="animate-pop">
            <h4 className="mb-2 flex items-center gap-2 font-display font-semibold"><Clock className="h-4 w-4 text-primary" /> 2. Choose a new time - {fmtDate(date)}</h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {slots.map((s) => {
                const cur = isCurrent(date, s.time);
                return (
                  <button key={s.time} disabled={s.state !== "free"} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${s.state !== "free" ? "cursor-not-allowed border-line/30 bg-muted/10 text-muted line-through opacity-60" : time === s.time ? "border-primary bg-primary text-primary-fg shadow-glow" : "border-line/60 hover:border-primary hover:text-primary"}`}>
                    {fmtTime(s.time)}{s.state !== "free" && <span className="block text-[9px] font-normal no-underline">{cur ? "Current" : s.state === "past" ? "Passed" : "Booked"}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="rs-reason">3. Reason for rescheduling (optional, shown to the patient)</label>
          <textarea id="rs-reason" rows={2} maxLength={500} className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: emergency surgery, hospital meeting" />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-ghost" onClick={close} disabled={busy}>Close</button>
          <button className="btn-primary" disabled={!date || !time || busy} onClick={submit}><CalendarClock className="h-4 w-4" /> {busy ? "Saving..." : "Confirm reschedule"}</button>
        </div>

        {history.length > 0 && (
          <div className="border-t border-line/40 pt-3">
            <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold"><History className="h-4 w-4 text-primary" /> Rescheduling history</h4>
            <ul className="space-y-1.5 text-xs text-muted">
              {history.map((h) => (
                <li key={h.id} className="rounded-lg border border-line/30 px-3 py-2">
                  {fmtDate(h.oldDate)} {fmtTime(h.oldTime)} &rarr; <b className="text-fg">{fmtDate(h.newDate)} {fmtTime(h.newTime)}</b>
                  <span className="ml-2">({new Date(h.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })})</span>
                  {h.reason && <span className="block">Reason: {h.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
