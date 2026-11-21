"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, CreditCard, Lock, Receipt, Search, Smartphone, UserCheck, UserPlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { addDays, fmtDate, fmtTime, money, todayISO, weekdayOf } from "@/lib/utilities";
import { toast } from "@/components/notifications/alerts";
import ReceiptModal from "@/components/appointments/ReceiptModal";
import { Appointment, Payment } from "@/types";
import { scheduleAppointmentReminders } from "@/lib/notificationService";

const STEPS = ["Doctor", "Date & time", "Details & Reason", "Review", "Payment"];
const PAY_PHASES = ["Contacting the demo payment service...", "Verifying the simulated payment...", "Confirming your appointment..."];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`);
const QUICK = ["Routine checkup", "Follow-up visit", "New symptoms to discuss", "Review of lab reports", "Second opinion"];

export default function BookingWizard() {
  const { data, doctorById, patientById, getSlots, bookPaidAppointment, bookGuestAppointment, session } = useApp();
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
  const payLock = useRef(false);
  const idemKey = useRef(newKey());

  // Guest details state (used when patient is not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestGender, setGuestGender] = useState<"Male" | "Female" | "Other">("Male");
  const [guestAge, setGuestAge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const isGuestBooking = !session;

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (isGuestBooking) {
      if (!guestName.trim()) errs.name = "Full name is required.";
      if (!guestEmail.trim() || !/\S+@\S+\.\S+/.test(guestEmail)) errs.email = "Please enter a valid email address.";
      if (!guestPhone.trim() || guestPhone.trim().length < 8) errs.phone = "Please enter a valid phone number.";
    }
    if (reason.trim().length < 5) errs.reason = "Please describe the reason for visit (at least 5 characters).";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const payNow = async () => {
    if (!doctor || payLock.current) return;
    payLock.current = true; setPaying(true); setPhase(0);
    const timers = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 1800)];

    let res: { ok: true; appointment: Appointment; payment: Payment } | { ok: false; error: string; code?: string };
    if (isGuestBooking) {
      const [r] = await Promise.all([
        bookGuestAppointment({
          doctorId,
          date,
          time,
          reason,
          guestDetails: {
            name: guestName.trim(),
            email: guestEmail.trim().toLowerCase(),
            phone: guestPhone.trim(),
            gender: guestGender,
            age: guestAge.trim() || undefined,
          },
          idempotencyKey: idemKey.current,
        }),
        sleep(2500),
      ]);
      res = r;
    } else {
      const [r] = await Promise.all([
        bookPaidAppointment({ doctorId, date, time, reason, idempotencyKey: idemKey.current }),
        sleep(2500),
      ]);
      res = r;
    }

    timers.forEach(clearTimeout);
    payLock.current = false; setPaying(false);
    if (!res.ok) {
      toast("error", "Payment not completed", `${res.error} No payment was recorded.`);
      if (res.code === "23505") { idemKey.current = newKey(); setTime(""); setStep(1); }
      return;
    }
    toast("success", "Booking confirmed", `Reference ${res.appointment.ref}`);
    const clientPhone = res.appointment.guestDetails?.phone || patient?.phone || "+92 300 1234567";
    const clientEmail = res.appointment.guestDetails?.email || patient?.email || "patient@medivance.pk";
    const clientName = res.appointment.guestDetails?.name || patient?.name || "Patient";

    scheduleAppointmentReminders({
      appointmentId: res.appointment.id,
      patientName: clientName,
      phone: clientPhone,
      email: clientEmail,
      doctorName: doctor.name,
      appointmentDate: res.appointment.date,
      appointmentTime: res.appointment.time,
    });

    setDone({ appointment: res.appointment, payment: res.payment });
  };

  if (done && doctor) {
    const { appointment: ap, payment: pay } = done;
    const clientName = ap.guestDetails?.name || patient?.name || "Patient";
    const clientEmail = ap.guestDetails?.email || patient?.email || "";
    const clientPhone = ap.guestDetails?.phone || patient?.phone || "";

    return (
      <div className="card mx-auto max-w-xl animate-pop p-6 text-center sm:p-8">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
        <h2 className="mt-4 font-display text-2xl font-bold">Booking Confirmed!</h2>
        <p className="mt-1 text-sm text-muted">
          Your appointment has been securely registered in the MEDIVANCE system.
        </p>

        <div className="mt-5 rounded-xl border border-line/50 bg-primary/5 p-4 text-left text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Appointment reference</p>
              <p className="font-display text-xl font-bold tracking-wider text-primary">{ap.ref}</p>
            </div>
            {ap.isGuest ? (
              <span className="badge border-primary/30 bg-primary/10 text-primary">Guest Booking</span>
            ) : (
              <span className="badge badge-approved">Patient Account</span>
            )}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div><dt className="label">Patient Name</dt><dd className="font-semibold">{clientName}</dd></div>
            <div><dt className="label">Contact</dt><dd className="font-semibold truncate">{clientPhone || clientEmail}</dd></div>
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(ap.date)}</dd></div>
            <div><dt className="label">Time</dt><dd className="font-semibold">{fmtTime(ap.time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(pay.amount)}</dd></div>
            <div><dt className="label">Payment status</dt><dd><span className="badge badge-approved">PAID</span></dd></div>
            <div className="col-span-2"><dt className="label">Transaction ID</dt><dd className="break-all font-semibold">{pay.transactionId}</dd></div>
          </dl>
          <p className="mt-3 text-[11px] text-muted">Simulated payment for demonstration. No real money was deducted.</p>
        </div>

        {/* Automated SMS & Email Reminders Status Block */}
        <div className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-left text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
            <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Automated Patient Reminders Scheduled:</span>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[11.5px]">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Instant Confirmation SMS & Email dispatched to <strong>{clientPhone || clientEmail}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-400 shrink-0" />
              <span>Automated <strong>24-Hour Before Reminder</strong> scheduled</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Automated <strong>1-Hour Before Urgent Alert</strong> scheduled</span>
            </li>
          </ul>
        </div>

        {ap.isGuest && (
          <div className="mt-5 rounded-xl border border-primary/25 bg-surface-2/60 p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><UserPlus className="h-4 w-4" /></span>
              <div className="flex-1">
                <h4 className="font-display font-semibold text-sm">Want a personal patient dashboard?</h4>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">
                  Create an account to track this visit, access prescriptions, review medical records, and consult with doctors online anytime.
                </p>
                <div className="mt-3">
                  <Link
                    href={`/register?name=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}&phone=${encodeURIComponent(clientPhone)}`}
                    className="btn-primary btn-sm !rounded-lg inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Create Patient Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <button className="btn-gold" onClick={() => setReceipt(true)}><Receipt className="h-4 w-4" /> View receipt</button>
          {session ? (
            <Link href="/patient/appointments" className="btn-primary">My appointments</Link>
          ) : (
            <Link href="/" className="btn-primary">Return Home</Link>
          )}
          <button className="btn-ghost" onClick={() => { setDone(null); setStep(0); setDoctorId(""); setDate(""); setTime(""); setReason(""); idemKey.current = newKey(); }}>Book another</button>
        </div>
        <ReceiptModal a={ap} doctor={doctor} open={receipt} onClose={() => setReceipt(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Dual Option Banner for Unauthenticated Users */}
      {isGuestBooking && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-surface-2/50 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-semibold text-sm">Two Easy Ways to Book</p>
                <p className="text-xs text-muted">
                  Book directly without login as a guest, or sign in to save this appointment to your personal dashboard.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="badge border-primary/30 bg-primary/10 text-primary text-xs font-medium">Guest Mode Active</span>
              <Link href={`/login/patient?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/patient/book")}`} className="btn-ghost btn-sm !rounded-lg text-xs font-semibold">
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>
      )}

      {session && patient && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-ok/25 bg-ok/5 px-4 py-2.5 text-xs text-muted">
          <span className="flex items-center gap-2 font-medium text-fg">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Booking with your patient account: <b>{patient.name}</b> ({patient.email})
          </span>
          <Link href="/patient" className="text-primary hover:underline">Go to Dashboard</Link>
        </div>
      )}

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
        <div className="card space-y-5 p-5">
          {/* Guest Patient Details Fields (if not logged in) */}
          {isGuestBooking && (
            <div className="space-y-4 rounded-xl border border-line/50 bg-surface-2/40 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Patient Details (Guest Booking)
                </h4>
                <span className="text-[11px] text-muted">No password required</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="guestName">Full Name *</label>
                  <input
                    id="guestName"
                    type="text"
                    className="input"
                    placeholder="e.g. Ayesha Khan"
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                  />
                  {errors.name && <p className="err">{errors.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="guestPhone">Phone Number *</label>
                  <input
                    id="guestPhone"
                    type="tel"
                    className="input"
                    placeholder="e.g. +92 300 1234567"
                    value={guestPhone}
                    onChange={(e) => { setGuestPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
                  />
                  {errors.phone && <p className="err">{errors.phone}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="guestEmail">Email Address *</label>
                  <input
                    id="guestEmail"
                    type="email"
                    className="input"
                    placeholder="e.g. patient@example.com"
                    value={guestEmail}
                    onChange={(e) => { setGuestEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
                  />
                  {errors.email && <p className="err">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label" htmlFor="guestGender">Gender</label>
                    <select
                      id="guestGender"
                      className="input"
                      value={guestGender}
                      onChange={(e) => setGuestGender(e.target.value as "Male" | "Female" | "Other")}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="guestAge">Age (optional)</label>
                    <input
                      id="guestAge"
                      type="number"
                      min={1}
                      max={120}
                      className="input"
                      placeholder="e.g. 28"
                      value={guestAge}
                      onChange={(e) => setGuestAge(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="reason">Reason for visit *</label>
            <textarea
              id="reason"
              rows={3}
              className="input"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: "" })); }}
              placeholder="Briefly describe why you want to see the doctor"
            />
            {errors.reason && <p className="err">{errors.reason}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setReason(r); setErrors((prev) => ({ ...prev, reason: "" })); }}
                className="badge cursor-pointer border-line/60 hover:border-primary hover:text-primary"
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button className="btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>
              Review <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && doctor && (
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Review your booking</h3>
            {isGuestBooking ? (
              <span className="badge border-primary/30 bg-primary/10 text-primary">Guest Booking</span>
            ) : (
              <span className="badge badge-approved">Patient Account</span>
            )}
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="label">Patient</dt>
              <dd className="font-semibold">{isGuestBooking ? guestName : patient?.name}</dd>
              <dd className="text-xs text-muted">{isGuestBooking ? `${guestEmail} - ${guestPhone}` : `${patient?.email} - ${patient?.phone}`}</dd>
            </div>
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Date</dt><dd className="font-semibold">{fmtDate(date)} ({weekdayOf(date)})</dd></div>
            <div><dt className="label">Time</dt><dd className="font-semibold">{fmtTime(time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(doctor.fee)} (paid online in next step - simulated)</dd></div>
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
            <div>
              <dt className="label">Patient</dt>
              <dd className="font-semibold">{isGuestBooking ? guestName : (patient?.name ?? "-")}</dd>
              <dd className="text-xs text-muted">
                {isGuestBooking ? `${guestEmail} - ${guestPhone}` : `${patient?.email}${patient?.phone ? ` - ${patient.phone}` : ""}`}
              </dd>
            </div>
            <div><dt className="label">Doctor</dt><dd className="font-semibold">{doctor.name}</dd></div>
            <div><dt className="label">Specialization</dt><dd className="font-semibold">{doctor.specialization}</dd></div>
            <div><dt className="label">Appointment</dt><dd className="font-semibold">{fmtDate(date)} at {fmtTime(time)}</dd></div>
            <div><dt className="label">Consultation fee</dt><dd className="font-semibold">{money(doctor.fee)}</dd></div>
            <div><dt className="label">Total amount</dt><dd className="font-display text-xl font-bold text-primary">{money(doctor.fee)}</dd></div>
          </dl>
          <p className="flex items-start gap-2 rounded-xl border border-line/50 bg-primary/5 p-3 text-xs text-muted">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            This is a simulated payment for demonstration. No real money is deducted and no card or wallet details are collected. The fee shown is the doctor&apos;s current fee and is recorded in the centralized appointment system.
          </p>
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
