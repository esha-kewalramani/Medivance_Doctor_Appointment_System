"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Droplet,
  Eye,
  EyeOff,
  Headphones,
  HeartPulse,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { validatePatient, Errors } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export default function RegisterForm() {
  const router = useRouter();
  const { registerPatient, login } = useApp();
  const qName = useQueryParam("name");
  const qEmail = useQueryParam("email");
  const qPhone = useQueryParam("phone");

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    password: "",
    confirm: "",
    agreeTerms: true,
  });

  const [e, setE] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (qName || qEmail || qPhone) {
      setF((prev) => ({
        ...prev,
        name: qName || prev.name,
        email: qEmail || prev.email,
        phone: qPhone || prev.phone,
      }));
    }
  }, [qName, qEmail, qPhone]);

  const set = (k: keyof typeof f) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = ev.target.type === "checkbox" ? (ev.target as HTMLInputElement).checked : ev.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    if (e[k]) {
      setE((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;

    const er = validatePatient(f);
    if (!f.agreeTerms) {
      er.agreeTerms = "You must accept the Terms & Conditions and Privacy Policy to register.";
    }

    setE(er);
    if (Object.keys(er).length) {
      toast("error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const r = await registerPatient({
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        dob: f.dob,
        gender: f.gender as "Male" | "Female" | "Other",
        bloodGroup: f.bloodGroup || undefined,
        password: f.password,
      });

      if (!r.ok) {
        setE({ email: r.error });
        toast("error", "Registration failed", r.error);
        setSubmitting(false);
        return;
      }

      await login("patient", f.email, f.password, true);
      toast("success", "Account created successfully", "Welcome to MEDIVANCE!");
      router.push("/patient");
    } catch {
      toast("error", "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-blue-50/40 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:from-slate-950 dark:via-[#070e20] dark:to-slate-950 dark:text-slate-100 flex items-center justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* ========================================================= */}
      {/* DUAL-THEME ATMOSPHERIC MEDICAL BACKGROUND & PULSE WAVE     */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-[130px] dark:bg-cyan-600/15 dark:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-400/20 blur-[140px] dark:bg-blue-600/15 dark:blur-[140px]" />

        {/* High-Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c710_1px,transparent_1px),linear-gradient(to_bottom,#0284c710_1px,transparent_1px)] bg-[size:3rem_3rem] dark:bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)]" />

        {/* Flowing ECG Pulse Wave Across Background */}
        <svg
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-48 text-cyan-600/15 dark:text-cyan-500/10"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M0,60 L200,60 L240,60 L250,20 L260,100 L275,10 L290,90 L300,60 L500,60 L700,60 L740,60 L750,20 L760,100 L775,10 L790,90 L800,60 L1200,60" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* ======================================================= */}
          {/* LEFT COLUMN: WHY JOIN MEDIVANCE? BENEFITS               */}
          {/* ======================================================= */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between space-y-6 xl:space-y-8 pr-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-100/80 border border-cyan-300 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400">
                <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-600 dark:text-cyan-400" /> Patient Portal
              </span>
              <h2 className="mt-3 font-display text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Why Join <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-700 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
                  MEDIVANCE?
                </span>
              </h2>
            </div>

            {/* 4 Feature Items */}
            <div className="space-y-4 xl:space-y-5">
              {[
                {
                  title: "Secure & Private",
                  desc: "256-bit encrypted health records & confidentiality.",
                  icon: ShieldCheck,
                },
                {
                  title: "Trusted Doctors",
                  desc: "Certified medical specialists and verified credentials.",
                  icon: UserCheck,
                },
                {
                  title: "Easy Booking",
                  desc: "Instant doctor scheduling without waiting queues.",
                  icon: Zap,
                },
                {
                  title: "24/7 Support",
                  desc: "Continuous patient assistance and emergency care.",
                  icon: Headphones,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-cyan-500/50 hover:bg-white hover:shadow-md dark:border-cyan-500/20 dark:bg-slate-900/60 dark:hover:border-cyan-400/50 dark:hover:bg-slate-900/90 dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100/70 border border-cyan-300/80 text-cyan-700 shadow-xs group-hover:scale-105 transition-transform dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-400 dark:shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors dark:text-white dark:group-hover:text-cyan-300">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tagline with Pulse Wave */}
            <div className="pt-2 border-t border-slate-200 dark:border-cyan-500/20">
              <svg className="h-6 w-32 text-cyan-600/70 dark:text-cyan-400/60 mb-2" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0 12 h25 l4 -8 l5 16 l5 -12 l4 8 h57" />
              </svg>
              <p className="font-display italic text-xs text-cyan-800 dark:text-cyan-300/90 font-medium">
                Better Care. A Healthier Tomorrow.
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* CENTER COLUMN: PATIENT REGISTRATION CARD                */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 w-full">
            <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-7 md:p-8 backdrop-blur-2xl shadow-xl shadow-slate-200/50 transition-all dark:border-cyan-500/40 dark:bg-[#09132b]/95 dark:shadow-[0_0_45px_rgba(6,182,212,0.18)]">
              
              {/* Header */}
              <div className="flex items-start gap-3.5 pb-5 border-b border-slate-200/80 dark:border-cyan-500/20">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-700 shadow-xs dark:bg-cyan-500/20 dark:border-cyan-400/40 dark:text-cyan-400 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <UserPlus className="h-6 w-6 stroke-[2.2]" />
                </span>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Patient Registration
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Create your account to access our healthcare services
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={submit} noValidate className="mt-5 space-y-5">
                
                {/* 1. PERSONAL INFORMATION SECTION */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                    <User className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          placeholder="Enter your full name"
                          value={f.name}
                          onChange={set("name")}
                        />
                      </div>
                      {e.name && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.name}</p>}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20 dark:[color-scheme:dark]"
                          value={f.dob}
                          onChange={set("dob")}
                        />
                      </div>
                      {e.dob && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.dob}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gender *
                      </label>
                      <div className="relative">
                        <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition appearance-none dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          value={f.gender}
                          onChange={set("gender")}
                        >
                          <option value="" className="text-slate-500 dark:bg-[#0b1736]">Select Gender</option>
                          <option value="Female" className="text-slate-900 dark:bg-[#0b1736] dark:text-white">Female</option>
                          <option value="Male" className="text-slate-900 dark:bg-[#0b1736] dark:text-white">Male</option>
                          <option value="Other" className="text-slate-900 dark:bg-[#0b1736] dark:text-white">Other</option>
                        </select>
                      </div>
                      {e.gender && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.gender}</p>}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="email"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          placeholder="Enter your email"
                          value={f.email}
                          onChange={set("email")}
                        />
                      </div>
                      {e.email && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.email}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="tel"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          placeholder="+92 3XX XXXXXXX"
                          value={f.phone}
                          onChange={set("phone")}
                        />
                      </div>
                      {e.phone && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.phone}</p>}
                    </div>

                    {/* Blood Group */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Blood Group (Optional)
                      </label>
                      <div className="relative">
                        <Droplet className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition appearance-none dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          value={f.bloodGroup}
                          onChange={set("bloodGroup")}
                        >
                          <option value="" className="text-slate-500 dark:bg-[#0b1736]">Select Blood Group</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg} className="text-slate-900 dark:bg-[#0b1736] dark:text-white">
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. ACCOUNT SECURITY SECTION */}
                <div className="space-y-3.5 pt-2 border-t border-slate-200/80 dark:border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                    <ShieldCheck className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                      Account Security
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    
                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          placeholder="Enter password"
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
                      {e.password && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white dark:focus:bg-[#0b1736] focus:ring-2 focus:ring-cyan-500/15 outline-none transition dark:border-cyan-500/30 dark:bg-[#0b1736] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                          placeholder="Confirm password"
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
                      {e.confirm && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.confirm}</p>}
                    </div>

                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={f.agreeTerms}
                      onChange={set("agreeTerms")}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-slate-50 text-cyan-600 focus:ring-cyan-500/20 accent-cyan-600 dark:border-cyan-500/40 dark:bg-[#0b1736] dark:text-cyan-500 dark:focus:ring-cyan-500/30 dark:accent-cyan-500"
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
                  {e.agreeTerms && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">{e.agreeTerms}</p>}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-900/10 hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 dark:from-cyan-500 dark:via-blue-600 dark:to-cyan-600 dark:shadow-[0_0_25px_rgba(6,182,212,0.35)] dark:hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
                  >
                    <UserPlus className="h-4 w-4 stroke-[2.5]" />
                    <span>{submitting ? "Registering..." : "Register Account"}</span>
                    <span>&rarr;</span>
                  </button>

                  <Link
                    href="/login"
                    className="w-full sm:w-auto py-3 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:border-slate-400 hover:bg-slate-100 active:scale-[0.98] transition flex items-center justify-center gap-2 dark:border-cyan-500/30 dark:bg-[#0b1736]/80 dark:text-cyan-300 dark:hover:border-cyan-400 dark:hover:bg-cyan-500/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: DOCTOR VISUAL & PRIORITY BADGE            */}
          {/* ======================================================= */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-between relative pl-2 min-h-[520px]">
            {/* Glowing Shield Decoration */}
            <div className="absolute top-10 right-0 z-0 h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none dark:bg-cyan-500/20" />

            <div className="relative z-10 w-full flex flex-col items-center">
              {/* Doctor Portrait Container with Dual-Theme Border and Shadow */}
              <div className="relative w-full max-w-[280px] rounded-3xl overflow-hidden border-2 border-slate-200/90 shadow-xl bg-gradient-to-b from-sky-100/90 to-slate-100/80 dark:border-cyan-500/40 dark:shadow-[0_0_35px_rgba(6,182,212,0.3)] dark:bg-gradient-to-b dark:from-[#0b1c40] dark:to-[#070f24]">
                {/* Shield Watermark Icon */}
                <div className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-white/85 border border-slate-200 text-cyan-700 backdrop-blur-md shadow-sm dark:bg-cyan-500/20 dark:border-cyan-400/40 dark:text-cyan-300 dark:shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                {/* Doctor Portrait */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/registration-doctor.jpg"
                  alt="Doctor with Stethoscope"
                  className="w-full h-auto object-cover object-top hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient Blend at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-100 via-slate-100/60 to-transparent dark:from-[#070f24] dark:via-[#070f24]/60 dark:to-transparent" />
              </div>

              {/* Floating "Your Health Our Priority" Pill Badge */}
              <div className="mt-5 w-full max-w-[280px] p-3 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-200/50 flex items-center gap-3 dark:border-cyan-500/40 dark:bg-slate-900/90 dark:shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-xs dark:bg-cyan-500/20 dark:border-cyan-400/40 dark:text-cyan-400 dark:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <HeartPulse className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
                    Your Health
                  </h4>
                  <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 dark:from-cyan-400 dark:to-sky-300">
                    Our Priority
                  </p>
                </div>
              </div>
            </div>



          </div>

        </div>

        {/* ========================================================= */}
        {/* MOBILE VIEW: BENEFIT PILLS ROW SHOWN BELOW CARD ON SMALL  */}
        {/* ========================================================= */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:hidden">
          {[
            { title: "Secure & Private", icon: ShieldCheck },
            { title: "Trusted Doctors", icon: UserCheck },
            { title: "Easy Booking", icon: Zap },
            { title: "24/7 Support", icon: Headphones },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl border border-slate-200/90 bg-white/90 text-center flex flex-col items-center gap-1.5 shadow-xs dark:border-cyan-500/20 dark:bg-slate-900/70"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-white">{item.title}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
