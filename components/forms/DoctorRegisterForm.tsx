"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { Errors, isEmail, isPhone, passwordIssue } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";

const AVAILABILITY_PRESETS = [
  "Mon - Fri (09:00 AM - 05:00 PM)",
  "Mon - Sat (10:00 AM - 06:00 PM)",
  "Mon - Fri (02:00 PM - 09:00 PM)",
  "Weekends (Saturday & Sunday 10:00 AM - 04:00 PM)",
  "Flexible / Custom Shift Hours",
] as const;

const EXPERIENCE_YEARS = [
  "1-2 Years",
  "3-5 Years",
  "6-10 Years",
  "11-15 Years",
  "15+ Years",
] as const;

interface DoctorRegisterProps {
  open?: boolean;
  onClose?: () => void;
}

export default function DoctorRegisterForm({ open = true, onClose }: DoctorRegisterProps) {
  const router = useRouter();
  const { data, registerDoctor } = useApp();

  const [f, setF] = useState({
    name: "Dr. ",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    experience: "3-5 Years",
    fee: "3000",
    schedule: "Mon - Fri (09:00 AM - 05:00 PM)",
    languages: "English, Urdu",
    bio: "",
    agreeTerms: true,
  });

  const [e, setE] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { confirmEmail: boolean }>(null);

  const set = (k: keyof typeof f) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = ev.target.type === "checkbox" ? (ev.target as HTMLInputElement).checked : ev.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    if (e[k]) {
      setE((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  const close = () => {
    if (busy) return;
    if (onClose) {
      onClose();
    } else {
      router.push("/login");
    }
    if (done) setDone(null);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;

    const er: Errors = {};
    if (f.name.trim().length < 5) er.name = "Enter your full name (including Dr. prefix).";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid phone number (10-15 digits).";
    
    const pw = passwordIssue(f.password);
    if (pw) er.password = pw;
    if (f.password !== f.confirm) er.confirm = "Passwords do not match.";
    if (!f.specialization) er.specialization = "Select your medical specialization.";
    if (!f.licenseNumber.trim() || f.licenseNumber.trim().length < 4) {
      er.licenseNumber = "Medical license / PMDC number is required.";
    }
    
    const expNum = parseInt(f.experience) || 5;
    const feeNum = Number(f.fee);
    if (f.fee === "" || !Number.isInteger(feeNum) || feeNum < 100 || feeNum > 1000000) {
      er.fee = "Enter consultation fee between Rs 100 and Rs 1,000,000.";
    }
    if (f.bio.trim().length < 15) {
      er.bio = "Tell patients about your clinical expertise (at least 15 characters).";
    }
    if (!f.agreeTerms) {
      er.agreeTerms = "You must agree to the Terms & Conditions and Privacy Policy.";
    }

    setE(er);
    if (Object.keys(er).length) {
      toast("error", "Please fix the highlighted fields");
      return;
    }

    setBusy(true);
    try {
      const r = await registerDoctor({
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        phone: f.phone.trim(),
        specialization: f.specialization,
        qualification: f.licenseNumber.trim(),
        experience: expNum,
        fee: feeNum,
        languages: f.languages,
        bio: f.bio.trim(),
      });

      setBusy(false);
      if (!r.ok) {
        setE({ email: r.error });
        toast("error", "Registration failed", r.error);
        return;
      }

      setDone({ confirmEmail: r.confirmEmail });
      toast("success", "Application submitted", "Your doctor profile is under review.");
    } catch {
      setBusy(false);
      toast("error", "An unexpected error occurred. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div
      className={
        onClose
          ? "fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-center justify-center transition-colors duration-300 dark:bg-slate-950/80"
          : "relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-blue-50/40 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:from-slate-950 dark:via-[#070e20] dark:to-slate-950 dark:text-slate-100 flex items-center justify-center py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8"
      }
    >
      {/* Background Glow & Subtle Grid (Scoped to theme) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[120px] dark:bg-cyan-600/10" />
        <div className="absolute bottom-1/3 right-1/4 h-[550px] w-[550px] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-400/15 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] bg-[size:3rem_3rem] dark:bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)]" />
      </div>

      <div
        className={`relative z-10 w-full max-w-7xl mx-auto ${
          onClose
            ? "rounded-3xl border border-slate-200/90 bg-gradient-to-b from-sky-50/95 via-white to-blue-50/90 p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl dark:border-cyan-500/30 dark:bg-[#070e20]/95 dark:from-slate-950 dark:via-[#070e20] dark:to-slate-950"
            : ""
        }`}
      >
        {/* Modal Close Button if opened as overlay */}
        {onClose && (
          <button
            onClick={close}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 grid h-9 w-9 place-items-center rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm backdrop-blur-md transition dark:bg-slate-900/90 dark:border-cyan-500/30 dark:text-cyan-300 dark:hover:text-white"
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {done ? (
          /* ======================================================= */
          /* SUCCESS SCREEN: APPLICATION UNDER REVIEW                */
          /* ======================================================= */
          <div className="max-w-md mx-auto rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 text-center shadow-lg backdrop-blur-2xl dark:border-cyan-500/40 dark:bg-[#091530]/95 space-y-4">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-500/40 dark:text-emerald-400 shadow-sm">
              <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Application Received!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-teal-700 dark:text-cyan-400">{f.name.trim()}</strong>. Your medical credentials have been submitted to the MEDIVANCE administrator.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 text-left text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Status: Pending Verification
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                Our clinical team reviews your license number. You will be able to sign in and activate your booking calendar once approved.
              </p>
            </div>

            <div className="pt-1 flex justify-center">
              <button
                onClick={close}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-teal-700 to-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:brightness-110 active:scale-95 transition dark:from-cyan-500 dark:to-blue-600"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================= */
          /* MAIN DOCTOR REGISTRATION INTERFACE (OPTIMIZED & COMPACT) */
          /* ======================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
            
            {/* LEFT / HERO SECTION: JOIN MEDIVANCE AS A DOCTOR */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4 lg:space-y-6 pr-0 lg:pr-2">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-100/90 border border-cyan-300 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400">
                  <Stethoscope className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Medical Provider Onboarding
                </span>
                
                <h1 className="mt-2.5 font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Join MEDIVANCE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-700 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
                    as a Doctor
                  </span>
                </h1>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                  Share your expertise, help more patients, and be part of a smarter healthcare community.
                </p>
              </div>

              {/* Composition: 3 Benefit Feature Pills + LARGER DOCTOR IMAGE */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                
                {/* 3 Benefit Feature Pills */}
                <div className="sm:col-span-6 space-y-2.5">
                  {[
                    {
                      title: "Manage Appointments",
                      desc: "Streamlined consultation queue & digital notes.",
                      icon: Calendar,
                    },
                    {
                      title: "Set Your Availability",
                      desc: "Complete flexibility over shift times & slots.",
                      icon: Clock,
                    },
                    {
                      title: "Connect with Patients",
                      desc: "Expand your practice with instant bookings.",
                      icon: Users,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/90 bg-white/85 shadow-xs backdrop-blur-md transition-all hover:border-cyan-500/40 hover:bg-white dark:border-cyan-500/20 dark:bg-slate-900/60 dark:hover:border-cyan-400/50 dark:hover:bg-slate-900/90 group"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-100/70 border border-cyan-300/80 text-cyan-700 shadow-2xs dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-400">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors dark:text-white dark:group-hover:text-cyan-300">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* LARGER DOCTOR IMAGE (Increased size + Subtle border & clean shadow) */}
                <div className="sm:col-span-6 flex justify-center sm:justify-end">
                  <div className="relative w-full max-w-[280px] sm:max-w-[300px] xl:max-w-[320px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-gradient-to-b from-sky-100/80 to-slate-100/70 dark:border-cyan-500/30 dark:shadow-[0_0_20px_rgba(6,182,212,0.15)] dark:bg-gradient-to-b dark:from-[#0b1c40] dark:to-[#070f24]">
                    {/* Badge */}
                    <div className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-xl bg-white/90 border border-slate-200 text-teal-700 shadow-xs dark:bg-cyan-500/20 dark:border-cyan-400/40 dark:text-cyan-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>

                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/doctor-join-hero.jpg"
                      alt="Doctor Smiling Confidently"
                      className="w-full h-auto object-cover object-top hover:scale-102 transition-transform duration-500"
                    />

                    {/* Gradient Blend at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-100 via-slate-100/60 to-transparent dark:from-[#070f24] dark:via-[#070f24]/60 dark:to-transparent" />
                  </div>
                </div>

              </div>

              {/* Tagline & ECG Wave */}
              <div className="pt-2 border-t border-slate-200 dark:border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-20 text-cyan-600/70 dark:text-cyan-400/60" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M0 12 h25 l4 -8 l5 16 l5 -12 l4 8 h57" />
                  </svg>
                  <p className="font-display italic text-[11px] text-cyan-800 dark:text-cyan-300/90 font-medium">
                    Better Healthcare. Together.
                  </p>
                </div>
                
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Verified Doctors Community
                </span>
              </div>
            </div>

            {/* RIGHT: CREATE DOCTOR ACCOUNT CARD (COMPACT & PROPORTIONED) */}
            <div className="lg:col-span-6 w-full max-w-xl mx-auto lg:max-w-none">
              <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 md:p-6 backdrop-blur-xl shadow-md transition-all dark:border-cyan-500/30 dark:bg-[#091530]/95 dark:shadow-[0_0_15px_rgba(6,182,212,0.08)]">
                
                {/* Card Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200/80 dark:border-cyan-500/20">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-100 border border-cyan-300 text-cyan-700 shadow-2xs dark:bg-cyan-500/20 dark:border-cyan-400/40 dark:text-cyan-400">
                    <Stethoscope className="h-5 w-5 stroke-[2.2]" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 dark:from-cyan-400 dark:to-sky-300">Doctor</span> Account
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Join MEDIVANCE and help patients live healthier lives.
                    </p>
                  </div>
                </div>

                {/* Form Fields with Theme-Consistent Focus Styles (NEVER turns white on dark mode) */}
                <form onSubmit={submit} noValidate className="mt-3.5 space-y-2.5 sm:space-y-3">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Full Name */}
                    <div>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Full Name (e.g. Dr. Sarah Ahmed)"
                          value={f.name}
                          onChange={set("name")}
                        />
                      </div>
                      {e.name && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.name}</p>}
                    </div>

                    {/* Email Address */}
                    <div>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="email"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Email Address"
                          value={f.email}
                          onChange={set("email")}
                        />
                      </div>
                      {e.email && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.email}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="tel"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Phone Number (+92 3XX...)"
                          value={f.phone}
                          onChange={set("phone")}
                        />
                      </div>
                      {e.phone && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.phone}</p>}
                    </div>

                    {/* Medical Specialization */}
                    <div>
                      <div className="relative">
                        <Stethoscope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 outline-none transition appearance-none focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          value={f.specialization}
                          onChange={set("specialization")}
                        >
                          <option value="" className="text-slate-500 dark:bg-[#0b1736]">Medical Specialization</option>
                          {data.specializations.map((s) => (
                            <option key={s.id} value={s.name} className="text-slate-900 dark:bg-[#0b1736] dark:text-white">
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {e.specialization && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.specialization}</p>}
                    </div>

                    {/* Medical License Number */}
                    <div>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Medical License Number (e.g. PMC-98)"
                          value={f.licenseNumber}
                          onChange={set("licenseNumber")}
                        />
                      </div>
                      {e.licenseNumber && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.licenseNumber}</p>}
                    </div>

                    {/* Years of Experience */}
                    <div>
                      <div className="relative">
                        <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 outline-none transition appearance-none focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          value={f.experience}
                          onChange={set("experience")}
                        >
                          <option value="" className="text-slate-500 dark:bg-[#0b1736]">Years of Experience</option>
                          {EXPERIENCE_YEARS.map((y) => (
                            <option key={y} value={y} className="text-slate-900 dark:bg-[#0b1736] dark:text-white">
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Availability Schedule */}
                  <div>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 outline-none transition appearance-none focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                        value={f.schedule}
                        onChange={set("schedule")}
                      >
                        {AVAILABILITY_PRESETS.map((sch) => (
                          <option key={sch} value={sch} className="text-slate-900 dark:bg-[#0b1736] dark:text-white">
                            {sch}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fee and Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-4">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Rs</span>
                        <input
                          type="number"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Fee (Rs)"
                          value={f.fee}
                          onChange={set("fee")}
                        />
                      </div>
                      {e.fee && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.fee}</p>}
                    </div>

                    <div className="sm:col-span-8">
                      <div className="relative">
                        <FileText className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <textarea
                          rows={1}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition resize-none focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Professional Bio: Clinical expertise..."
                          value={f.bio}
                          onChange={set("bio")}
                        />
                      </div>
                      {e.bio && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.bio}</p>}
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-8 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Create Password"
                          value={f.password}
                          onChange={set("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {e.password && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.password}</p>}
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-8 py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0b1736] dark:focus:border-cyan-400 dark:focus:ring-cyan-500/25"
                          placeholder="Confirm Password"
                          value={f.confirm}
                          onChange={set("confirm")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition"
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {e.confirm && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.confirm}</p>}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="pt-0.5">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={f.agreeTerms}
                        onChange={set("agreeTerms")}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 bg-slate-50 text-cyan-600 focus:ring-cyan-500/20 accent-cyan-600 dark:border-cyan-500/40 dark:bg-[#0b1736] dark:text-cyan-500 dark:focus:ring-cyan-500/30 dark:accent-cyan-500"
                      />
                      <span>
                        I agree to the{" "}
                        <Link href="/terms" className="text-cyan-700 hover:underline font-semibold dark:text-cyan-400">
                          Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-cyan-700 hover:underline font-semibold dark:text-cyan-400">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    {e.agreeTerms && <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">{e.agreeTerms}</p>}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-2.5 sm:py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 dark:from-cyan-400 dark:via-sky-500 dark:to-blue-600 dark:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    >
                      <UserPlus className="h-4 w-4 stroke-[2.5]" />
                      <span>{busy ? "Submitting Application..." : "Create Account"}</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Already registered?{" "}
                    <Link
                      href="/login?role=doctor"
                      onClick={() => onClose && onClose()}
                      className="font-bold text-teal-700 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      Sign In
                    </Link>
                  </div>

                </form>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
