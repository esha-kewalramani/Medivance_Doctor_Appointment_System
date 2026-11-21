"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import ForgotPasswordModal from "@/components/forms/ForgotPasswordModal";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { isEmail } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";
import { Role } from "@/types";

interface UnifiedAuthCardProps {
  initialRole?: Role;
}

export default function UnifiedAuthCard({ initialRole = "patient" }: UnifiedAuthCardProps) {
  const router = useRouter();
  const { login, session, ready } = useApp();
  const next = useQueryParam("next");

  const [activeRole, setActiveRole] = useState<Role>(initialRole);
  
  // Independent input states for each of the 3 portal cards
  const [emails, setEmails] = useState<Record<Role, string>>({
    patient: "",
    doctor: "",
    admin: "",
  });
  const [passwords, setPasswords] = useState<Record<Role, string>>({
    patient: "",
    doctor: "",
    admin: "",
  });
  const [remembers, setRemembers] = useState<Record<Role, string | boolean>>({
    patient: true,
    doctor: true,
    admin: true,
  });
  const [showPasswords, setShowPasswords] = useState<Record<Role, boolean>>({
    patient: false,
    doctor: false,
    admin: false,
  });
  const [errors, setErrors] = useState<Partial<Record<Role, { email?: string; password?: string; form?: string }>>>({});
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (ready && session?.role) {
      const dest = next && next.startsWith("/") ? next : `/${session.role}`;
      router.replace(dest);
    }
  }, [ready, session, next, router]);

  useEffect(() => {
    if (initialRole) setActiveRole(initialRole);
  }, [initialRole]);

  const handleCardSubmit = async (role: Role, e: React.FormEvent) => {
    e.preventDefault();
    setActiveRole(role);
    const email = emails[role]?.trim() || "";
    const password = passwords[role] || "";
    const remember = Boolean(remembers[role]);

    const newErrors: { email?: string; password?: string; form?: string } = {};
    if (!isEmail(email)) newErrors.email = "Please enter a valid email address.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";

    setErrors((prev) => ({ ...prev, [role]: newErrors }));
    if (newErrors.email || newErrors.password) return;

    setLoadingRole(role);
    try {
      const res = await login(role, email, password, remember);
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [role]: { form: res.error } }));
        toast("error", `${role.toUpperCase()} Login Failed`, res.error);
        setLoadingRole(null);
        return;
      }

      const confirmedRole = (res as { role?: Role }).role || role;
      toast("success", "Welcome to MEDIVANCE", `Signed in to ${confirmedRole.toUpperCase()} portal.`);
      const dest = next && next.startsWith("/") ? next : `/${confirmedRole}`;
      router.push(dest);
    } catch {
      setErrors((prev) => ({
        ...prev,
        [role]: { form: "An unexpected error occurred. Please try again." },
      }));
      setLoadingRole(null);
    }
  };

  const openForgot = (role: Role) => {
    setForgotEmail(emails[role] || "");
    setForgotOpen(true);
  };

  const portalConfigs: Array<{
    role: Role;
    title: string;
    subtitle: string;
    icon: typeof User;
    emailLabel: string;
    emailPlaceholder: string;
    buttonText: string;
    footerText: string;
    footerLink?: string;
    footerActionText?: string;
  }> = [
    {
      role: "patient",
      title: "Patient",
      subtitle: "Patient Portal",
      icon: User,
      emailLabel: "Email address",
      emailPlaceholder: "Enter your email address",
      buttonText: "Patient Sign In",
      footerText: "New to MEDIVANCE? ",
      footerLink: "/register",
      footerActionText: "Create account",
    },
    {
      role: "doctor",
      title: "Doctor",
      subtitle: "Doctor Portal",
      icon: Stethoscope,
      emailLabel: "Email address",
      emailPlaceholder: "Enter your email address",
      buttonText: "Doctor Sign In",
      footerText: "Want to join our team? ",
      footerLink: "/register/doctor",
      footerActionText: "Apply as a Doctor",
    },
    {
      role: "admin",
      title: "Admin",
      subtitle: "Admin Portal",
      icon: Shield,
      emailLabel: "Admin email",
      emailPlaceholder: "Enter your admin email",
      buttonText: "Admin Sign In",
      footerText: "",
      footerActionText: "Authorized access only",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-[#ffffff] text-slate-800 transition-colors duration-300 dark:bg-[#020b18] dark:text-slate-100 flex flex-col items-center justify-center py-6 sm:py-10 px-3 sm:px-6">
      
      {/* ========================================================= */}
      {/* 2K 16:9 HIGH-DEFINITION ARTWORK BACKGROUND                */}
      {/* Stethoscope bottom-left, Caduceus top-right, hospital     */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none flex items-center justify-center">
        {/* Light Mode 2K Banner */}
        <img
          src="/images/workspace-bg-light.jpg"
          alt="MEDIVANCE Healthcare Background"
          className="h-full w-full object-cover object-center dark:hidden"
        />

        {/* Dark Mode 2K Banner */}
        <img
          src="/images/workspace-bg-dark.jpg"
          alt="MEDIVANCE Healthcare Dark Background"
          className="h-full w-full object-cover object-center hidden dark:block"
        />
      </div>

      <div className="relative z-10 w-full max-w-[860px] lg:max-w-[890px] mx-auto flex flex-col items-center">
        
        {/* ======================================================= */}
        {/* HEADER SECTION: "Welcome to MEDIVANCE"                  */}
        {/* ======================================================= */}
        <div className="text-center mb-4 sm:mb-6 space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-[#0b2545] dark:text-white">
            Welcome to{" "}
            <span className="text-[#007791] dark:text-[#00c8ff] dark:drop-shadow-[0_0_14px_rgba(0,200,255,0.7)]">
              MEDIVANCE
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Choose your portal and securely access your account
          </p>
        </div>

        {/* Mobile Portal Selector Tabs (< md) */}
        <div className="md:hidden w-full max-w-[300px] mb-4">
          <div className="flex items-center rounded-2xl p-1 bg-slate-100/90 border border-slate-200/90 dark:bg-[#030e1d]/90 dark:border-cyan-500/30 shadow-inner">
            {(["patient", "doctor", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRole(r)}
                className={`flex-1 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeRole === r
                    ? "bg-gradient-to-r from-[#008ba3] to-[#00b4d8] text-white shadow-sm dark:from-[#0072ff] dark:to-[#00b4d8] dark:shadow-[0_0_12px_rgba(0,180,216,0.5)]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================= */}
        {/* 3 PORTAL CARDS (PATIENT, DOCTOR, ADMIN) SIDE BY SIDE    */}
        {/* Sleek, reduced width cards matching exact reference     */}
        {/* ======================================================= */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 items-stretch justify-center">
          {portalConfigs.map((cfg) => {
            const isSelected = activeRole === cfg.role;
            const cardErrors = errors[cfg.role] || {};
            const isLoading = loadingRole === cfg.role;
            const IconComponent = cfg.icon;

            return (
              <div
                key={cfg.role}
                onClick={() => setActiveRole(cfg.role)}
                className={`relative rounded-[22px] p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer max-w-[320px] mx-auto w-full md:max-w-none ${
                  // Responsive visibility on small screens: active card shows on mobile, all 3 show on md+
                  isSelected ? "block" : "hidden md:flex"
                } ${
                  isSelected
                    ? "border-[1.8px] border-[#00b4d8] bg-white/95 shadow-[0_12px_32px_rgba(2,132,199,0.16)] dark:border-[#00c8ff] dark:bg-[#06152be6] dark:backdrop-blur-2xl dark:shadow-[0_0_28px_rgba(0,200,255,0.38)] scale-[1.01] z-20"
                    : "border border-slate-200/90 bg-white/85 shadow-xs hover:shadow-md dark:border-[#153457]/80 dark:bg-[#06152b]/80 dark:backdrop-blur-xl dark:hover:border-cyan-500/40 hover:scale-[1.005]"
                }`}
              >
                {/* Subtle Card Glow / Accent Sheen */}
                {isSelected && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-cyan-400/15 via-transparent to-transparent" />
                )}

                <div>
                  {/* Top Emblem & Header */}
                  <div className="text-center mb-3">
                    <div
                      className={`mx-auto mb-1.5 relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-transform ${
                        isSelected
                          ? "bg-[#e0f7fa] text-[#007791] dark:bg-[#072444] dark:text-[#00f2fe] border-2 border-cyan-300 dark:border-cyan-400 shadow-xs dark:shadow-[0_0_16px_rgba(0,242,254,0.55)] scale-105"
                          : "bg-slate-100 text-slate-600 dark:bg-[#081b36] dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/30"
                      }`}
                    >
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" />
                    </div>

                    <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {cfg.title}
                    </h2>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                      {cfg.subtitle}
                    </p>
                  </div>

                  {/* Form Error Banner */}
                  {cardErrors.form && (
                    <div
                      role="alert"
                      className="mb-2.5 rounded-xl border border-rose-300 bg-rose-50/90 py-1 px-2 text-[10.5px] text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300 flex items-start gap-1"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                      <span>{cardErrors.form}</span>
                    </div>
                  )}

                  {/* Form Inputs */}
                  <form
                    onSubmit={(e) => handleCardSubmit(cfg.role, e)}
                    noValidate
                    className="space-y-2.5"
                  >
                    {/* Email Input */}
                    <div>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          placeholder={cfg.emailPlaceholder}
                          value={emails[cfg.role]}
                          onFocus={() => setActiveRole(cfg.role)}
                          onChange={(e) =>
                            setEmails((prev) => ({ ...prev, [cfg.role]: e.target.value }))
                          }
                          className="w-full h-9 sm:h-[38px] rounded-xl border border-slate-200 bg-white/90 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-500/20 dark:border-[#16365b] dark:bg-[#041021]/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:bg-[#07172e] dark:focus:ring-1 dark:focus:ring-cyan-500/40"
                        />
                      </div>
                      {cardErrors.email && (
                        <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 pl-1">
                          {cardErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <input
                          type={showPasswords[cfg.role] ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          placeholder="Password"
                          value={passwords[cfg.role]}
                          onFocus={() => setActiveRole(cfg.role)}
                          onChange={(e) =>
                            setPasswords((prev) => ({ ...prev, [cfg.role]: e.target.value }))
                          }
                          className="w-full h-9 sm:h-[38px] rounded-xl border border-slate-200 bg-white/90 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-500/20 dark:border-[#16365b] dark:bg-[#041021]/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:bg-[#07172e] dark:focus:ring-1 dark:focus:ring-cyan-500/40"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              [cfg.role]: !prev[cfg.role],
                            }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-0.5"
                          aria-label={showPasswords[cfg.role] ? "Hide password" : "Show password"}
                        >
                          {showPasswords[cfg.role] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {cardErrors.password && (
                        <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 pl-1">
                          {cardErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-[10.5px] pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(remembers[cfg.role])}
                          onChange={(e) =>
                            setRemembers((prev) => ({ ...prev, [cfg.role]: e.target.checked }))
                          }
                          className="h-3 w-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-cyan-500/40 dark:bg-[#040f1f] accent-cyan-500"
                        />
                        <span>Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => openForgot(cfg.role)}
                        className="font-medium text-[#0284c7] hover:text-[#0369a1] dark:text-[#00c8ff] dark:hover:text-cyan-300 hover:underline transition"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Sign In CTA Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-1.5 w-full h-9 sm:h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#006e82] via-[#008ba3] to-[#00a3be] text-xs font-semibold text-white shadow-xs hover:brightness-105 active:scale-[0.99] transition disabled:opacity-70 dark:from-[#0072ff] dark:to-[#00b4d8] dark:shadow-[0_0_18px_rgba(0,180,216,0.45)]"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Signing In...
                        </span>
                      ) : (
                        <>
                          <LogIn className="h-3 w-3" />
                          <span>{cfg.buttonText}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Footer Link */}
                <div className="mt-3 pt-1.5 border-t border-slate-200/60 dark:border-cyan-500/20 text-center text-[10.5px]">
                  {cfg.footerLink ? (
                    <p className="text-slate-500 dark:text-slate-400">
                      {cfg.footerText}
                      <Link
                        href={cfg.footerLink}
                        className="font-semibold text-[#0284c7] hover:text-[#0369a1] dark:text-[#00c8ff] dark:hover:text-cyan-300 hover:underline transition"
                      >
                        {cfg.footerActionText}
                      </Link>
                    </p>
                  ) : (
                    <span className="font-medium text-slate-400 dark:text-slate-400">
                      {cfg.footerActionText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        key={String(forgotOpen)}
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={forgotEmail}
      />
    </div>
  );
}
