"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, CreditCard, Lock, Receipt, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { addDays, fmtDate, fmtTime, money, todayISO, weekdayOf } from "@/lib/utilities";
import { toast } from "@/components/notifications/alerts";
import ReceiptModal from "@/components/appointments/ReceiptModal";
import { Appointment, Payment } from "@/types";

const STEPS = ["Doctor", "Date & time", "Reason", "Review", "Payment"];
const PAY_PHASES = ["Contacting the demo payment service...", "Verifying the simulated payment...", "Confirming your appointment..."];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`);
const QUICK = ["Routine checkup", "Follow-up visit", "New symptoms to discuss", "Review of lab reports", "Second opinion"];

export default function BookingWizard() {
  const { data, doctorById, patientById, getSlots, bookPaidAppointment, session } = useApp();
  const preselect = useQueryParam("doctor");
  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("all");
  const [done, setDone] = useState<{ appointment: Appointment; payment: Payment } | null>(null);
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState(0);
  const [receipt, setReceipt] = useState(false);
  const payLock = useRef(false); // blocks repeated clicks while a payment is in flight
  const idemKey = useRef(newKey()); // same key on retry => the server returns the original booking, never a second payment
  const [reasonErr, setReasonErr] = useState("");

  useEffect(() => {
    if (preselect && doctorById(preselect)) { setDoctorId(preselect); setStep(1); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect]);

  const doctor = doctorById(doctorId);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i)), []);
  const slots = useMemo(() => (doctorId && date ? getSlots(doctorId, date) : []), [doctorId, date, getSlots]);
  const freeCount = (d: string) => getSlots(doctorId, d).filter((s) => s.state === "free").length;
  const doctors = data.doctors.filter((d) => (spec === "all" || d.specialization === spec) && `${d.name} ${d.specialization}`.toLowerCase().includes(q.toLowerCase()));

  const patient = session ? patientById(session.userId) : undefined;

  const payNow = async () => {
    if (!session || !doctor || payLock.current) return;
    payLock.current = true; setPaying(true); setPhase(0);
    const timers = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 1800)];
    // the animation lasts at least ~2.5 s; the real save happens in the same moment and is atomic (appointment + payment together)
    const [r] = await Promise.all([bookPaidAppointment({ doctorId, date, time, reason, idempotencyKey: idemKey.current }), sleep(2500)]);
    timers.forEach(clearTimeout);
    payLock.current = false; setPaying(false);
    if (!r.ok) {
      toast("error", "Payment not completed", `${r.error} No payment was recorded.`);
      if (r.code === "23505") { idemKey.current = newKey(); setTime(""); setStep(1); }
      return;
    }
    toast("success", "Payment successful", `Reference ${r.appointment.ref}`);
    setDone({ appointment: r.appointment, payment: r.payment });
  };

  if (done && doctor) {
    const { appointment: ap, payment: pay } = done;
    return (
      <div className="card mx-auto max-w-xl animate-pop p-6 text-center sm:p-8">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
        <h2 className="mt-4 font-display text-2xl font-bold">Payment successful!</h2>
        <p className="mt-1 text-sm text-muted">Your booking is confirmed and paid. The doctor will approve it shortly.</p>
        <div className="mt-5 rounded-xl border border-line/50 bg-primary/5 p-4 text-left text-sm">
          <p className="label">Appointment reference</p><p className="font-display text-xl font-bold tracking-wider text-primary">{ap.ref}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(ap.date)}</dd></div>
            <div><dt className="label">Time</dt><dd className="font-semibold">{fmtTime(ap.time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(pay.amount)}</dd></div>
            <div><dt className="label">Payment status</dt><dd><span className="badge badge-approved">PAID</span></dd></div>
            <div className="col-span-2"><dt className="label">Transaction ID</dt><dd className="break-all font-semibold">{pay.transactionId}</dd></div>
            <div className="col-span-2"><dt className="label">Payment method</dt><dd className="font-semibold">{pay.method}</dd></div>
          </dl>
          <p className="mt-3 text-[11px] text-muted">Simulated payment for demonstration. No real money was deducted.</p>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <button className="btn-gold" onClick={() => setReceipt(true)}><Receipt className="h-4 w-4" /> View receipt</button>
          <Link href="/patient/appointments" className="btn-primary">My appointments</Link>
          <button className="btn-ghost" onClick={() => { setDone(null); setStep(0); setDoctorId(""); setDate(""); setTime(""); setReason(""); idemKey.current = newKey(); }}>Book another</button>
        </div>
        <ReceiptModal a={ap} doctor={doctor} open={receipt} onClose={() => setReceipt(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ol className="mb-6 flex gap-1 sm:grid sm:grid-cols-5 sm:gap-2" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center text-center">
            <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-bold transition sm:h-9 sm:w-9 ${i < step ? "border-primary bg-primary text-primary-fg" : i === step ? "border-primary text-primary shadow-glow" : "border-line text-muted"}`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={`mt-1 hidden text-[11px] font-semibold sm:block sm:text-xs ${i === step ? "text-primary" : "text-muted"}`}>{s}</span>
          </li>
        ))}
      </ol>

      {doctor && step > 0 && (
        <div className="card mb-4 flex items-center gap-3 p-3">
          <Avatar name={doctor.name} photo={doctor.photo} size={44} />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{doctor.name}</p><p className="text-xs text-muted">{doctor.specialization} - {money(doctor.fee)}</p></div>
          <button className="btn-ghost btn-sm" onClick={() => { setStep(0); setDate(""); setTime(""); }}>Change</button>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="card grid gap-3 p-4 sm:grid-cols-2">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search doctor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search doctor" /></div>
            <select className="input" value={spec} onChange={(e) => setSpec(e.target.value)} aria-label="Specialization"><option value="all">All specializations</option>{data.specializations.map((s) => <option key={s.id}>{s.name}</option>)}</select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map((d) => (
              <button key={d.id} onClick={() => { setDoctorId(d.id); setDate(""); setTime(""); setStep(1); }} className={`card card-hover flex items-center gap-3 p-4 text-left ${doctorId === d.id ? "!border-primary" : ""}`}>
                <Avatar name={d.name} photo={d.photo} size={52} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{d.name}</span><span className="block text-xs text-muted">{d.specialization} - {d.experience} yrs</span><span className="text-xs font-semibold text-primary">{money(d.fee)}</span></span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </button>
            ))}
            {doctors.length === 0 && <p className="card p-6 text-center text-sm text-muted sm:col-span-2">No doctors match your search.</p>}
          </div>
        </div>
      )}

      {step === 1 && doctor && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 font-display font-semibold">Choose a date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const works = doctor.availability.some((w) => w.day === weekdayOf(d));
                const free = works ? freeCount(d) : 0;
                const dt = new Date(d + "T00:00:00");
                return (
                  <button key={d} disabled={!free} onClick={() => { setDate(d); setTime(""); }} className={`flex w-[72px] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${date === d ? "border-primary bg-primary text-primary-fg shadow-glow" : "border-line/60 hover:border-primary"}`} aria-pressed={date === d}>
                    <span className="text-[11px] uppercase">{weekdayOf(d)}</span><span className="font-display text-xl font-bold">{dt.getDate()}</span>
                    <span className="text-[10px]">{dt.toLocaleString("en", { month: "short" })}</span>
                    <span className={`mt-1 text-[10px] ${date === d ? "" : free ? "text-ok" : "text-muted"}`}>{free ? `${free} free` : works ? "Full" : "Off"}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {date && (
            <div className="card animate-pop p-4">
              <h3 className="mb-1 flex items-center gap-2 font-display font-semibold"><Clock className="h-4 w-4 text-primary" /> Available times - {fmtDate(date)}</h3>
              <p className="mb-3 text-xs text-muted">Greyed slots are already taken and cannot be booked.</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {slots.map((s) => (
                  <button key={s.time} disabled={s.state !== "free"} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${s.state !== "free" ? "cursor-not-allowed border-line/30 bg-muted/10 text-muted line-through opacity-60" : time === s.time ? "border-primary bg-primary text-primary-fg shadow-glow" : "border-line/60 hover:border-primary hover:text-primary"}`}>
                    {fmtTime(s.time)}{s.state === "booked" && <span className="block text-[9px] font-normal no-underline">Booked</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between"><button className="btn-ghost" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" /> Back</button><button className="btn-primary" disabled={!date || !time} onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4 p-5">
          <div><label className="label" htmlFor="reason">Reason for visit</label>
            <textarea id="reason" rows={4} className="input" value={reason} onChange={(e) => { setReason(e.target.value); setReasonErr(""); }} placeholder="Briefly describe why you want to see the doctor" />
            {reasonErr && <p className="err">{reasonErr}</p>}</div>
          <div className="flex flex-wrap gap-2">{QUICK.map((r) => <button key={r} onClick={() => setReason(r)} className="badge cursor-pointer border-line/60 hover:border-primary hover:text-primary">{r}</button>)}</div>
          <div className="flex justify-between"><button className="btn-ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button className="btn-primary" onClick={() => { if (reason.trim().length < 5) { setReasonErr("Please enter at least 5 characters."); return; } setStep(3); }}>Review <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      )}

      {step === 3 && doctor && (
        <div className="card space-y-4 p-5">
          <h3 className="font-display text-lg font-semibold">Review your booking</h3>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(date)} ({weekdayOf(date)})</dd></div>
            <div><dt className="label">Time</dt><dd className="font-semibold">{fmtTime(time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(doctor.fee)} (paid online in the next step - simulated)</dd></div>
            <div className="sm:col-span-2"><dt className="label">Reason</dt><dd>{reason}</dd></div>
          </dl>
          <div className="flex justify-between"><button className="btn-ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</button><button className="btn-gold" onClick={() => { idemKey.current = newKey(); setStep(4); }}><CreditCard className="h-4 w-4" /> Continue to payment</button></div>
        </div>
      )}

      {step === 4 && doctor && (
        <div className="card relative space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">Payment summary</h3>
            <span className="badge badge-pending">DEMO / SIMULATED PAYMENT</span>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="label">Patient</dt><dd className="font-semibold">{patient?.name ?? "-"}</dd><dd className="text-xs text-muted">{patient?.email}{patient?.phone ? ` - ${patient.phone}` : ""}</dd></div>
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Appointment</dt><dd className="font-semibold">{fmtDate(date)} at {fmtTime(time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(doctor.fee)}</dd></div>
            <div><dt className="label">Total amount</dt><dd className="font-display text-xl font-bold text-primary">{money(doctor.fee)}</dd></div>
          </dl>          <p className="flex items-start gap-2 rounded-xl border border-line/50 bg-primary/5 p-3 text-xs text-muted"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />This is a simulated payment for demonstration. No real money is deducted and no card or wallet details are collected. The fee shown is the doctor&apos;s current fee and is re-checked by the server.</p>
          <div className="flex justify-between">
            <button className="btn-ghost" disabled={paying} onClick={() => setStep(3)}><ArrowLeft className="h-4 w-4" /> Cancel payment</button>
            <button className="btn-gold" disabled={paying} onClick={payNow}><CreditCard className="h-4 w-4" /> {paying ? "Processing..." : `Pay Now - ${money(doctor.fee)}`}</button>
          </div>
          {paying && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-surface/90 backdrop-blur-sm" role="status" aria-live="polite">
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <span className="h-14 w-14 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
                <p className="font-display text-lg font-semibold">{PAY_PHASES[phase]}</p>
                <p className="text-xs text-muted">Please do not close or refresh this page.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
