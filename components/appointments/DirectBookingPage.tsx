"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HeartPulse,
  Info,
  Lock,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  UserPlus,
  Zap,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { fmtDate, fmtTime, money, todayISO, weekdayOf } from "@/lib/utilities";
import { toast } from "@/components/notifications/alerts";
import ReceiptModal from "@/components/appointments/ReceiptModal";
import { Appointment, Doctor, Payment } from "@/types";

const REASONS_LIST = [
  "Routine checkup",
  "Follow-up consultation",
  "New symptoms or pain",
  "Review of lab reports",
  "Chronic condition monitoring",
  "Second opinion",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PAY_PHASES = [
  "Contacting the demo payment service...",
  "Verifying the simulated payment...",
  "Confirming your appointment...",
];

// Default 8 time slots matching the 4x2 grid in the reference image
const DEFAULT_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
];

// Smart medical organ/symptom mapping so searches like "heart" match Cardiologists, "brain" matches Neurologists, etc.
const KEYWORD_SPEC_MAP: Record<string, string[]> = {
  cardiology: ["heart", "cardio", "chest", "chest pain", "bp", "blood pressure", "hypertension", "palpitation", "cholesterol", "attack", "ecg", "cardiac", "pulse", "angina"],
  neurology: ["brain", "headache", "migraine", "nerve", "stroke", "neuro", "seizure", "paralysis", "vertigo", "memory", "spine", "numbness", "tremor", "dizziness", "epilepsy"],
  ophthalmology: ["eye", "vision", "sight", "glasses", "lens", "cataract", "retina", "ophthalmic", "blur", "cornea", "dry eye", "laser", "specs", "glaucoma", "blind", "optometry"],
  dermatology: ["skin", "acne", "rash", "hair", "hair fall", "nail", "allergy", "eczema", "derma", "pigmentation", "mole", "itch", "dandruff", "psoriasis"],
  orthopedics: ["bone", "joint", "knee", "spine", "back pain", "fracture", "ortho", "arthritis", "shoulder", "muscle", "ligament", "hip", "ankle", "sprain"],
  pediatrics: ["child", "baby", "kid", "infant", "pediatric", "vaccine", "growth", "toddler", "newborn", "children", "pediatrician"],
  "general medicine": ["fever", "cough", "flu", "cold", "infection", "stomach", "weakness", "general", "physician", "routine", "diabetes", "vomiting", "nausea", "body ache", "fatigue", "throat", "sugar"],
  gynecology: ["women", "pregnancy", "period", "maternity", "fertility", "gynae", "female", "menstrual", "pcos", "delivery", "ultrasound", "pregnant"],
  dentistry: ["tooth", "teeth", "dental", "gum", "cavity", "oral", "dentist", "braces", "root canal", "bleeding gums", "toothache"],
};

const STEPS = [
  { stepNum: 1, label: "Doctor" },
  { stepNum: 2, label: "Date & Time" },
  { stepNum: 3, label: "Details & Reason" },
  { stepNum: 4, label: "Review" },
  { stepNum: 5, label: "Payment" },
];

export default function DirectBookingPage() {
  const { data, doctorById, patientById, getSlots, bookPaidAppointment, bookGuestAppointment, session } = useApp();
  const preselectDoctor = useQueryParam("doctor");

  // Selection states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("all");

  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  // Patient details state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Visa" | "Mastercard" | "Amex" | "Apple Pay" | "Google Pay">("Visa");

  // Errors & submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState<{ appointment: Appointment; payment: Payment } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const payLock = useRef(false);
  const idemKey = useRef(newKey());

  // Logged-in patient
  const loggedPatient = session && session.role === "patient" ? patientById(session.userId) : null;

  // Auto-fill patient details if logged in
  useEffect(() => {
    if (loggedPatient) {
      setFullName(loggedPatient.name || "");
      setPhone(loggedPatient.phone || "");
      setEmail(loggedPatient.email || "");
    }
  }, [loggedPatient]);

  // Set initial selected doctor
  useEffect(() => {
    if (preselectDoctor && doctorById(preselectDoctor)) {
      setSelectedDoctorId(preselectDoctor);
    } else if (!selectedDoctorId && data.doctors.length > 0) {
      setSelectedDoctorId(data.doctors[0].id);
    }
  }, [preselectDoctor, data.doctors, doctorById, selectedDoctorId]);

  const selectedDoctor: Doctor | undefined =
    doctorById(selectedDoctorId) || (data.doctors.length > 0 ? data.doctors[0] : undefined);

  // Set initial selected date
  useEffect(() => {
    if (!selectedDate && selectedDoctor) {
      setSelectedDate(todayISO());
    }
  }, [selectedDate, selectedDoctor]);

  // Available slots for selected doctor and date
  const availableSlots = useMemo(() => {
    if (!selectedDoctor?.id || !selectedDate) return DEFAULT_TIME_SLOTS.map((t) => ({ time: t, state: "free" as const }));
    const computed = getSlots(selectedDoctor.id, selectedDate);
    if (!computed || computed.length === 0) {
      return DEFAULT_TIME_SLOTS.map((t) => ({ time: t, state: "free" as const }));
    }
    return computed;
  }, [selectedDoctor, selectedDate, getSlots]);

  // Set default time slot
  useEffect(() => {
    if (!selectedTime && availableSlots.length > 0) {
      const firstFree = availableSlots.find((s) => s.state === "free");
      if (firstFree) setSelectedTime(firstFree.time);
    }
  }, [availableSlots, selectedTime]);

  // Horizontal scroll container ref & control for doctor cards
  const doctorListRef = useRef<HTMLDivElement>(null);
  const scrollDoctors = (direction: "left" | "right") => {
    if (doctorListRef.current) {
      const offset = direction === "left" ? -320 : 320;
      doctorListRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Doctors list filtered by search (with smart organ/symptom mapping) and specialization
  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.doctors.filter((d) => {
      const matchSpec = selectedSpec === "all" || d.specialization.toLowerCase() === selectedSpec.toLowerCase();
      if (!matchSpec) return false;
      if (!q) return true;

      // 1. Direct text match against name, spec, qualification, or bio
      const directMatch = `${d.name} ${d.specialization} ${d.qualification} ${d.bio || ""}`.toLowerCase().includes(q);
      if (directMatch) return true;

      // 2. Semantic organ / symptom / keyword match (e.g. "heart" -> Cardiology, "brain" -> Neurology, "eye" -> Ophthalmology)
      const specLower = d.specialization.toLowerCase();
      for (const [specKey, keywords] of Object.entries(KEYWORD_SPEC_MAP)) {
        if (specLower.includes(specKey) || specKey.includes(specLower)) {
          if (keywords.some((kw) => kw.includes(q) || q.includes(kw))) {
            return true;
          }
        }
      }
      return false;
    });
  }, [data.doctors, selectedSpec, searchQuery]);

  // Calendar matrix calculation (42 cells: 6 rows of 7 days)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

    const days: {
      dayNumber: number;
      dateIso: string;
      isCurrentMonth: boolean;
      isPast: boolean;
      isAvailable: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const m = calMonth === 0 ? 11 : calMonth - 1;
      const y = calMonth === 0 ? calYear - 1 : calYear;
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      days.push({
        dayNumber: dNum,
        dateIso: iso,
        isCurrentMonth: false,
        isPast: true,
        isAvailable: false,
      });
    }

    const todayStr = todayISO();

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = iso < todayStr;
      const dayOfWeek = weekdayOf(iso);
      const works = Boolean(
        !isPast &&
        selectedDoctor?.availability?.some((w) => w.day === dayOfWeek)
      );

      days.push({
        dayNumber: d,
        dateIso: iso,
        isCurrentMonth: true,
        isPast,
        isAvailable: works || !isPast,
      });
    }

    // Trailing days to fill 42 cells (6 rows of 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = calMonth === 11 ? 0 : calMonth + 1;
      const y = calMonth === 11 ? calYear + 1 : calYear;
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateIso: iso,
        isCurrentMonth: false,
        isPast: false,
        isAvailable: false,
      });
    }

    return days;
  }, [calYear, calMonth, selectedDoctor]);

  // Navigate calendar month
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  // Determine current active step (1 to 5) for progress bar
  const activeStep = useMemo(() => {
    if (!selectedDoctorId) return 1;
    if (!selectedDate || !selectedTime) return 2;
    if (!fullName.trim() || !phone.trim() || !reason.trim()) return 3;
    return 4;
  }, [selectedDoctorId, selectedDate, selectedTime, fullName, phone, reason]);

  // Validate inputs
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!selectedDoctor) errs.doctor = "Please choose a doctor.";
    if (!selectedDate) errs.date = "Please select an appointment date on the calendar.";
    if (!selectedTime) errs.time = "Please choose an available time slot.";
    if (!fullName.trim()) errs.name = "Full name is required.";
    if (!phone.trim() || phone.trim().length < 8) errs.phone = "Valid phone number is required.";
    if (!reason.trim()) errs.reason = "Please select or enter a reason for visit.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Pay and Confirm
  const handleConfirmAndPay = async () => {
    if (!selectedDoctor || payLock.current) return;
    if (!validateForm()) {
      toast("error", "Please fill in required fields", "Ensure doctor, date, time, name, phone, and reason are completed.");
      return;
    }

    payLock.current = true;
    setPaying(true);
    setPhase(0);

    const timer1 = setTimeout(() => setPhase(1), 800);
    const timer2 = setTimeout(() => setPhase(2), 1700);

    let res: { ok: true; appointment: Appointment; payment: Payment } | { ok: false; error: string; code?: string };

    if (!session || session.role !== "patient") {
      // Guest booking workflow
      const [r] = await Promise.all([
        bookGuestAppointment({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          time: selectedTime,
          reason: reason.trim(),
          guestDetails: {
            name: fullName.trim(),
            email: email.trim().toLowerCase() || `${fullName.toLowerCase().replace(/\s+/g, "")}@guest.medivance.pk`,
            phone: phone.trim(),
            gender: "Other",
          },
          idempotencyKey: idemKey.current,
        }),
        sleep(2400),
      ]);
      res = r;
    } else {
      // Logged-in patient booking workflow
      const [r] = await Promise.all([
        bookPaidAppointment({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          time: selectedTime,
          reason: reason.trim(),
          idempotencyKey: idemKey.current,
        }),
        sleep(2400),
      ]);
      res = r;
    }

    clearTimeout(timer1);
    clearTimeout(timer2);
    payLock.current = false;
    setPaying(false);

    if (!res.ok) {
      toast("error", "Booking could not be completed", res.error);
      if (res.code === "23505") {
        idemKey.current = newKey();
        setSelectedTime("");
      }
      return;
    }

    toast("success", "Appointment Confirmed & Paid", `Reference: ${res.appointment.ref}`);
    setDone({ appointment: res.appointment, payment: res.payment });
  };

  // Confirmed Screen
  if (done && selectedDoctor) {
    const { appointment: ap, payment: pay } = done;
    const clientName = ap.guestDetails?.name || loggedPatient?.name || fullName;
    const clientEmail = ap.guestDetails?.email || loggedPatient?.email || email;
    const clientPhone = ap.guestDetails?.phone || loggedPatient?.phone || phone;

    return (
      <div className="section-padding py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="card animate-pop p-6 text-center sm:p-10 border-primary/30 shadow-soft">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ok/15 text-ok shadow-glow">
              <CheckCircle2 className="h-11 w-11" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-fg">
              Booking <span className="text-primary">Confirmed!</span>
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your appointment is recorded in the MEDIVANCE system and your consultation fee payment has been verified.
            </p>

            <div className="mt-6 rounded-2xl border border-line/60 bg-surface-2/50 p-5 text-left text-sm backdrop-blur space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Appointment Reference</p>
                  <p className="font-display text-2xl font-bold tracking-widest text-primary">{ap.ref}</p>
                </div>
                {ap.isGuest ? (
                  <span className="badge border-primary/30 bg-primary/10 text-primary font-semibold">Direct Guest Booking</span>
                ) : (
                  <span className="badge badge-approved font-semibold">Patient Account</span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3.5">
                <div>
                  <dt className="text-xs text-muted">Patient Name</dt>
                  <dd className="font-semibold text-fg">{clientName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Contact</dt>
                  <dd className="font-semibold text-fg truncate">{clientPhone || clientEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Doctor</dt>
                  <dd className="font-semibold text-fg">{selectedDoctor.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Specialty</dt>
                  <dd className="font-semibold text-fg">{selectedDoctor.specialization}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Date & Time</dt>
                  <dd className="font-semibold text-primary">{fmtDate(ap.date)} at {fmtTime(ap.time)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Consultation Fee</dt>
                  <dd className="font-semibold text-fg">{money(pay.amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Payment Status</dt>
                  <dd className="font-semibold text-ok flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PAID (Simulated)
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Payment Method</dt>
                  <dd className="font-semibold text-fg">{pay.method || paymentMethod}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Booking Mode</dt>
                  <dd className="font-semibold text-fg">{ap.isGuest ? "Direct Guest Booking" : "Patient Account"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted">Transaction ID</dt>
                  <dd className="break-all font-mono text-xs font-semibold text-muted">{pay.transactionId}</dd>
                </div>
              </dl>
              <p className="text-[11px] text-muted pt-2 border-t border-line/30">
                * Simulated payment demonstration. No real money was charged. Receipt is ready to print or save as PDF.
              </p>
            </div>

            {ap.isGuest && (
              <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h4 className="font-display font-semibold text-sm text-fg">Want to track this visit in your personal space?</h4>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">
                      Register an account with your booking details to track upcoming appointments, review doctor prescriptions, and access clinical notes.
                    </p>
                    <div className="mt-3">
                      <Link
                        href={`/register?name=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}&phone=${encodeURIComponent(clientPhone)}`}
                        className="btn-primary btn-sm !rounded-xl inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Create Patient Account
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button className="btn-primary !rounded-xl" onClick={() => setShowReceipt(true)}>
                <Receipt className="h-4 w-4" /> Download Receipt
              </button>
              {session ? (
                <Link href="/patient/appointments" className="btn-ghost !rounded-xl">My Appointments</Link>
              ) : (
                <Link href="/" className="btn-ghost !rounded-xl">Return Home</Link>
              )}
              <button
                className="btn-ghost !rounded-xl"
                onClick={() => {
                  setDone(null);
                  setSelectedDate(todayISO());
                  setSelectedTime("");
                  idemKey.current = newKey();
                }}
              >
                Book Another
              </button>
            </div>

            <ReceiptModal a={ap} doctor={selectedDoctor} open={showReceipt} onClose={() => setShowReceipt(false)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden pt-1 pb-16 sm:pt-2 sm:pb-20">
      {/* THEME-ADAPTIVE FULL WIDESCREEN BACKGROUND BEHIND HERO & PANEL */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden">
        {/* Dark Theme Artwork provided by user */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/booking-bg-dark.jpg"
          alt=""
          aria-hidden="true"
          className="hidden dark:block h-full w-full object-cover object-[88%_top] sm:object-[86%_top] lg:object-[85%_top] opacity-95 transition-opacity duration-300"
        />

        {/* Light Theme Artwork provided by user */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/booking-bg-light.jpg"
          alt=""
          aria-hidden="true"
          className="block dark:hidden h-full w-full object-cover object-[88%_top] sm:object-[86%_top] lg:object-[85%_top] opacity-95 transition-opacity duration-300"
        />

        {/* Soft edge blending gradients for smooth transition into page colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/50 to-transparent via-45% lg:from-bg/90 lg:via-bg/25 lg:to-transparent lg:via-40%" />
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-bg/80 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================= */}
        {/* HERO SECTION - REVEALS BACKGROUND DOCTOR WITH NO OVERLAP  */}
        {/* ========================================================= */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 items-end pt-2 sm:pt-3 pb-4 sm:pb-6 lg:pb-8 overflow-visible">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 relative z-10 space-y-2.5 sm:space-y-3 pb-1 sm:pb-2 lg:pb-3">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface-2/70 px-3.5 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <CalendarIcon className="h-3.5 w-3.5" /> Direct Appointment Booking
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-fg leading-[1.12]">
              Book an <span className="font-serif italic font-normal text-primary">Appointment</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-xs sm:text-sm text-muted leading-relaxed">
              Choose your preferred doctor, select a convenient date & time, and book your visit instantly — with or without logging in.
            </p>

            {/* Feature Badges */}
            <div className="pt-0.5 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-fg/90">
              <span className="inline-flex items-center gap-1.5 text-muted shrink-0">
                <Zap className="h-3.5 w-3.5 text-primary" /> Quick & Easy Booking
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure Payment
              </span>
            </div>
          </div>

          {/* Right Area: Open transparent space so the background doctor shows cleanly with ZERO duplicate image */}
          <div className="lg:col-span-5 relative min-h-[200px] sm:min-h-[240px] lg:min-h-[260px] pointer-events-none" />
        </section>

        {/* ========================================================= */}
        {/* MASTER BOOKING CONSOLE (MOVED UPWARD TO OVERLAP)          */}
        {/* ========================================================= */}
        <div className="relative z-20 -mt-4 sm:-mt-6 lg:-mt-8 w-full rounded-3xl sm:rounded-[2.5rem] border border-line/60 bg-surface/90 p-4 sm:p-6 lg:p-7 backdrop-blur-2xl shadow-2xl space-y-5 sm:space-y-6">
          {/* SIMULATED PAYMENT PROCESSING OVERLAY */}
          {paying && (
            <div className="absolute inset-0 z-50 grid place-items-center rounded-[inherit] bg-surface/90 backdrop-blur-md animate-fade-in" role="status" aria-live="polite">
              <div className="flex flex-col items-center gap-4 px-6 text-center max-w-md">
                <span className="h-14 w-14 animate-spin rounded-full border-4 border-primary/25 border-t-primary shadow-glow" />
                <div className="space-y-1">
                  <p className="font-display text-xl font-bold text-fg">{PAY_PHASES[phase]}</p>
                  <p className="text-xs text-muted">Processing simulated transaction with MEDIVANCE demo gateway.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line/60 bg-surface-2/60 px-4 py-1.5 text-xs text-muted">
                  <Lock className="h-3.5 w-3.5 text-primary" /> 256-bit encrypted simulated channel
                </div>
                <p className="text-[11px] text-muted">Please do not close or refresh this page.</p>
              </div>
            </div>
          )}

          {/* 5-STEP PROGRESS BAR (EXACT CIRCLES, LINES & LABELS) */}
          <div className="relative mx-auto max-w-3xl w-full px-2 sm:px-4">
            <div className="flex items-center justify-between w-full">
              {STEPS.map(({ stepNum, label }, idx) => {
                const isCompleted = activeStep > stepNum;
                const isActive = activeStep === stepNum;

                return (
                  <div key={stepNum} className={`flex items-center ${idx < 4 ? "flex-1" : ""}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className={`grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full text-xs sm:text-sm font-bold transition-all ${
                          isActive
                            ? "bg-primary text-primary-fg shadow-glow ring-4 ring-primary/25 scale-105"
                            : isCompleted
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "border border-line/70 bg-surface-2/60 text-muted"
                        }`}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : stepNum}
                      </span>
                      <span
                        className={`mt-1.5 text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap transition-colors ${
                          isActive ? "text-primary font-bold" : isCompleted ? "text-fg font-medium" : "text-muted"
                        }`}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Connecting line */}
                    {idx < 4 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 sm:mx-3 -mt-4 transition-colors ${
                          activeStep > stepNum ? "bg-primary" : "bg-line/40"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================= */}
          {/* ROW 1: CHOOSE YOUR DOCTOR (LEFT) & SELECT DATE (RIGHT)  */}
          {/* ======================================================= */}
          <div className="w-full grid gap-5 lg:gap-6 lg:grid-cols-12 items-stretch">
            {/* LEFT: CHOOSE YOUR DOCTOR */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-3.5">
              {/* Choose Doctor Header with Scroll Chevrons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-fg">Choose Your Doctor</h2>
                    <p className="text-[11px] text-muted">
                      Browse our expert doctors and select the one you prefer.
                    </p>
                  </div>
                </div>

                {/* Left/Right Scroll Arrows */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollDoctors("left")}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line/70 bg-surface-2/70 text-muted hover:text-fg hover:border-primary hover:bg-surface-2 transition active:scale-95 shadow-xs"
                    title="Scroll left"
                    aria-label="Scroll doctors left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollDoctors("right")}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line/70 bg-surface-2/70 text-muted hover:text-fg hover:border-primary hover:bg-surface-2 transition active:scale-95 shadow-xs"
                    title="Scroll right"
                    aria-label="Scroll doctors right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Search & Filter Row */}
              <div className="grid gap-2 sm:grid-cols-12">
                <div className="sm:col-span-8 relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    className="input pl-8 text-xs !py-2 !rounded-xl"
                    placeholder="Search doctor by name or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4">
                  <select
                    className="input text-xs !py-2 !rounded-xl"
                    value={selectedSpec}
                    onChange={(e) => setSelectedSpec(e.target.value)}
                  >
                    <option value="all">All Specializations</option>
                    {data.specializations.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HORIZONTAL SCROLLABLE DOCTOR CARDS (MATCHING REFERENCE DESIGN) */}
              <div className="relative">
                <div
                  ref={doctorListRef}
                  className="custom-horizontal-scrollbar flex gap-3 overflow-x-auto pb-4 pt-1.5 scroll-smooth snap-x snap-mandatory focus:outline-none"
                >
                  {filteredDoctors.map((d) => {
                    const isSelected = selectedDoctor?.id === d.id;

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDoctorId(d.id);
                          setSelectedTime("");
                          setErrors((prev) => ({ ...prev, doctor: "" }));
                        }}
                        className={`card relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 transition-all cursor-pointer border shrink-0 w-[185px] sm:w-[205px] snap-start ${
                          isSelected
                            ? "border-2 !border-primary bg-primary/10 shadow-glow ring-2 ring-primary/40"
                            : "border-line/70 bg-surface-2/50 hover:border-primary/50"
                        }`}
                      >
                        {/* Top Checkmark Badge if Selected */}
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-fg text-xs shadow-md">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}

                        {/* Circular Doctor Photo & Centered Available Badge */}
                        <div className="relative mx-auto mt-1 flex flex-col items-center">
                          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-primary/25 bg-surface shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={d.photo}
                              alt={d.name}
                              loading="lazy"
                              className="h-full w-full object-cover object-top transition duration-300 hover:scale-105"
                            />
                          </div>

                          {/* Centered Available Badge directly below circular portrait */}
                          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/40 bg-black/75 text-emerald-400 backdrop-blur-sm shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" /> Available
                          </span>
                        </div>

                        {/* Doctor Info */}
                        <div className="pt-2.5 text-left space-y-1">
                          <h3 className="truncate font-display text-sm sm:text-base font-bold text-fg">{d.name}</h3>
                          <p className="truncate text-xs text-primary font-medium flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" /> {d.specialization}
                          </p>

                          <div className="flex items-center gap-1 text-[11px] text-muted">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span className="font-bold text-fg">{d.rating.toFixed(1)}</span>
                            <span className="truncate">({(d.reviews?.length || 0) * 40 + 80}+ reviews)</span>
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-fg pt-0.5">
                            {money(d.fee)} <span className="text-[11px] font-normal text-muted">/ Consultation</span>
                          </p>
                        </div>

                        {/* Button */}
                        <button
                          type="button"
                          className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-semibold transition ${
                            isSelected
                              ? "bg-primary text-primary-fg shadow-md hover:brightness-110"
                              : "border border-line/80 bg-surface-2/70 text-fg hover:border-primary/60 hover:bg-surface-2"
                          }`}
                        >
                          Select Doctor
                        </button>
                      </div>
                    );
                  })}

                  {filteredDoctors.length === 0 && (
                    <div className="w-full py-8 text-center text-sm text-muted">
                      No doctors found matching your criteria. Try searching &quot;heart&quot;, &quot;brain&quot;, or &quot;eye&quot;.
                    </div>
                  )}
                </div>

                {/* Sub-bar scroll indicator & doctor count */}
                {filteredDoctors.length > 3 && (
                  <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-muted">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Showing all {filteredDoctors.length} doctors — scroll horizontally or use arrows
                    </span>
                    <span className="hidden sm:inline text-muted/80">Scrollbar below cards</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: SELECT DATE (INTERACTIVE CALENDAR) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between space-y-3 rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-fg">Select Date</h2>
                  <p className="text-[11px] text-muted">Choose a convenient date for your appointment.</p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded-lg p-1 hover:bg-surface text-muted hover:text-fg transition"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-display text-xs sm:text-sm font-bold text-fg">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg p-1 hover:bg-surface text-muted hover:text-fg transition"
                  aria-label="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
                {DAY_HEADERS.map((h) => (
                  <div key={h} className="py-0.5">{h}</div>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarDays.map((cd, idx) => {
                  const isSelected = selectedDate === cd.dateIso;
                  const isCurrent = cd.isCurrentMonth;
                  const canClick = isCurrent && cd.isAvailable;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!canClick}
                      onClick={() => {
                        setSelectedDate(cd.dateIso);
                        setSelectedTime("");
                        setErrors((prev) => ({ ...prev, date: "" }));
                      }}
                      className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto rounded-full flex items-center justify-center font-semibold text-xs transition ${
                        isSelected
                          ? "bg-primary text-primary-fg shadow-glow font-bold scale-105 ring-2 ring-primary/40"
                          : canClick
                          ? "hover:bg-primary/20 text-fg cursor-pointer"
                          : isCurrent
                          ? "text-muted/40 cursor-not-allowed"
                          : "text-muted/20 cursor-not-allowed"
                      }`}
                    >
                      {cd.dayNumber}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="pt-2 text-[11px] text-muted flex items-center justify-between border-t border-line/40">
                  <span>Selected: <b className="text-primary font-semibold">{fmtDate(selectedDate)}</b></span>
                  <span>({weekdayOf(selectedDate)})</span>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* DIVIDER BETWEEN ROW 1 AND ROW 2                         */}
          {/* ======================================================= */}
          <div className="w-full border-t border-line/40 my-6 sm:my-8" />

          {/* ======================================================= */}
          {/* ROW 2: TIME SLOTS (LEFT) & PATIENT DETAILS (RIGHT)      */}
          {/* ======================================================= */}
          <div className="w-full grid gap-5 lg:gap-6 lg:grid-cols-12 items-start">
            {/* LEFT: AVAILABLE TIME SLOTS (2 ROWS OF 4 PILLS) */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-fg">Available Time Slots</h2>
                  <p className="text-[11px] text-muted">Select a time slot that works for you.</p>
                </div>
              </div>

              {/* Slot Pills Grid: exactly 4 columns x 2 rows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {availableSlots.slice(0, 8).map((s) => {
                  const isFree = s.state === "free";
                  const isSelected = selectedTime === s.time;

                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!isFree}
                      onClick={() => {
                        setSelectedTime(s.time);
                        setErrors((prev) => ({ ...prev, time: "" }));
                      }}
                      className={`rounded-xl py-2 px-2.5 text-xs font-bold text-center transition border ${
                        isSelected
                          ? "bg-primary text-primary-fg border-primary shadow-glow ring-2 ring-primary/40"
                          : isFree
                          ? "border-line/60 bg-surface-2/50 text-fg hover:border-primary hover:text-primary hover:bg-primary/5"
                          : "border-line/30 bg-muted/10 text-muted line-through opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {fmtTime(s.time)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: PATIENT DETAILS (2x2 FORM GRID) */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Info className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-fg">Patient Details</h2>
                  <p className="text-[11px] text-muted">Fill in your details to book the appointment.</p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="label text-[11px] font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    className="input text-xs sm:text-sm !py-2 !rounded-xl"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                  />
                  {errors.name && <p className="err text-[11px] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="label text-[11px] font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    className="input text-xs sm:text-sm !py-2 !rounded-xl"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                  />
                  {errors.phone && <p className="err text-[11px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="label text-[11px] font-semibold mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="input text-xs sm:text-sm !py-2 !rounded-xl"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-[11px] font-semibold mb-1">Reason for Visit *</label>
                  <select
                    className="input text-xs sm:text-sm !py-2 !rounded-xl"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setErrors((prev) => ({ ...prev, reason: "" }));
                    }}
                  >
                    <option value="">Select reason</option>
                    {REASONS_LIST.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.reason && <p className="err text-[11px] mt-1">{errors.reason}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* DIVIDER BETWEEN ROW 2 AND ROW 3                         */}
          {/* ======================================================= */}
          <div className="w-full border-t border-line/40 my-6 sm:my-8" />

          {/* ======================================================= */}
          {/* ROW 3: APPOINTMENT SUMMARY (LEFT) & PAYMENT (RIGHT)     */}
          {/* ======================================================= */}
          <div className="w-full grid gap-5 lg:gap-6 lg:grid-cols-12 items-stretch">
            {/* LEFT: APPOINTMENT SUMMARY (MATCHING REFERENCE EXACTLY) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-fg">Appointment Summary</h3>
                </div>
              </div>

              {selectedDoctor && (
                <div className="rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 sm:p-4 flex flex-col justify-center h-[calc(100%-2.75rem)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Doctor Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-surface shrink-0 border border-line/60">
                        <Avatar name={selectedDoctor.name} photo={selectedDoctor.photo} size={48} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-fg truncate">{selectedDoctor.name}</p>
                        <p className="text-xs text-primary flex items-center gap-1 font-medium truncate">
                          <HeartPulse className="h-3 w-3 shrink-0" /> {selectedDoctor.specialization}
                        </p>
                        <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-semibold text-fg">{selectedDoctor.rating.toFixed(1)}</span>
                          <span>({(selectedDoctor.reviews?.length || 0) * 40 + 80}+ reviews)</span>
                        </p>
                      </div>
                    </div>

                    {/* Date Block */}
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shrink-0">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Date</p>
                        <p className="text-xs font-bold text-fg whitespace-nowrap">{selectedDate ? fmtDate(selectedDate) : "Nov 20, 2026"}</p>
                      </div>
                    </div>

                    {/* Time Block */}
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Time</p>
                        <p className="text-xs font-bold text-fg whitespace-nowrap">{selectedTime ? fmtTime(selectedTime) : "09:00 AM"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: PAYMENT (MATCHING REFERENCE + DASHBOARD INTEGRATION) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-fg">Payment</h3>
                  </div>
                </div>
                <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold">
                  DEMO / SIMULATED PAYMENT
                </span>
              </div>

              <div className="rounded-2xl border border-line/60 bg-surface-2/40 p-3.5 sm:p-4 flex flex-col justify-between h-[calc(100%-2.75rem)] space-y-3">
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted">Consultation Fee</span>
                    <span className="font-display text-base sm:text-lg font-bold text-primary">
                      {selectedDoctor ? money(selectedDoctor.fee) : "Rs 0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-ok shrink-0" /> Simulated payment for demonstration. Instant verification & receipt.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-line/40">
                  {/* Real Payment Brand Badges with Interactive Selection */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: "Visa", label: "VISA", badge: <span className="font-sans text-[11px] font-black italic tracking-tighter text-[#1a1f71] dark:text-[#4385f5]">VISA</span> },
                      { id: "Mastercard", label: "Mastercard", badge: (
                        <div className="flex items-center -space-x-1.5">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b] opacity-90" />
                          <span className="h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
                        </div>
                      )},
                      { id: "Amex", label: "Amex", badge: <span className="text-white font-extrabold text-[9px] tracking-tight">AMEX</span>, bg: "bg-[#006fcf]" },
                      { id: "Apple Pay", label: "Apple Pay", badge: (
                        <div className="flex items-center gap-0.5 text-white font-medium text-[10px]">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.68-11.23-20.73-14.79-33.15-3.56-12.42-5.34-23.95-5.34-34.6 0-14.75 3.78-26.65 11.35-35.7 7.57-9.06 17.15-13.68 28.74-13.88 4.48 0 9.77 1.25 15.86 3.75 6.09 2.5 10.15 3.8 12.18 3.91 2.03-.11 6.31-1.46 12.83-4.04 6.52-2.58 11.93-3.75 16.23-3.52 11.83.67 21.35 4.96 28.56 12.87-10.28 6.22-15.31 14.86-15.09 25.92.22 8.79 3.58 16.14 10.08 22.05 6.5 5.91 14.15 9.3 22.95 10.18-2.39 7.28-5.22 14.33-8.49 21.17zM119.22 31.92c0-7.05 2.5-13.59 7.5-19.62 5-6.03 11.25-9.8 18.75-11.3-.33 6.95-2.87 13.54-7.62 19.77-4.75 6.23-11 9.94-18.63 11.15z"/></svg> Pay
                        </div>
                      ), bg: "bg-black" },
                      { id: "Google Pay", label: "Google Pay", badge: (
                        <div className="flex items-center gap-0.5 text-neutral-800 font-medium text-[10px]">
                          <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg> <span className="font-semibold text-neutral-600">Pay</span>
                        </div>
                      ), bg: "bg-white" },
                    ].map((m) => {
                      const isChosen = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`flex h-7 items-center justify-center rounded-lg border px-2 shadow-sm transition cursor-pointer ${
                            m.bg || "bg-surface"
                          } ${
                            isChosen
                              ? "ring-2 ring-primary border-primary scale-105"
                              : "border-line/60 hover:border-primary/60 opacity-85 hover:opacity-100"
                          }`}
                          title={m.label}
                        >
                          {m.badge}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confirm & Pay CTA Button */}
                  <button
                    type="button"
                    disabled={paying}
                    onClick={handleConfirmAndPay}
                    className="btn-primary !py-2.5 !px-5 !rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-glow shrink-0 transition-transform active:scale-95"
                  >
                    Confirm & Pay <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
