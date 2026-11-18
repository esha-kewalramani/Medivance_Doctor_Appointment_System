"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, LogIn, Mail, Stethoscope, UserRound, ShieldCheck } from "lucide-react";
import DoctorRegisterForm from "@/components/forms/DoctorRegisterForm";
import ForgotPasswordModal from "@/components/forms/ForgotPasswordModal";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { DEMO_ACCOUNTS } from "@/lib/mock-data";
import { isEmail } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";
import { Role } from "@/types";

const META = { patient: { title: "Patient Login", icon: UserRound }, doctor: { title: "Doctor Login", icon: Stethoscope }, admin: { title: "Admin Login", icon: ShieldCheck } } as const;

export default function LoginForm({ role }: { role: Role }) {
  const router = useRouter();
  const { login, session, ready } = useApp();
  const next = useQueryParam("next");
  const [f, setF] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ email?: string; password?: string; form?: string }>({});
  const [forgot, setForgot] = useState(false);
  const [fEmail, setFEmail] = useState("");
  const [register, setRegister] = useState(false);
  const M = META[role];

  useEffect(() => { if (ready && session?.role === role) router.replace(next || `/${role}`); }, [ready, session, role, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!f.password) er.password = "Password is required.";
    else if (f.password.length < 8) er.password = "Password must be at least 8 characters.";
    setErr(er);
    if (er.email || er.password) return;
    const r = await login(role, f.email, f.password, f.remember);
    if (!r.ok) { setErr({ form: r.error }); toast("error", "Login failed", r.error); return; }
    // Fire toast and begin navigation simultaneously — toast appears while portal loads.
    toast("success", "Welcome back!", `Signed in as ${role}.`);
    router.push(next && next.startsWith("/") ? next : `/${role}`);
  };

  const demo = () => { const a = DEMO_ACCOUNTS[role]; setF({ ...f, email: a.email, password: a.password }); setErr({}); };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-primary/70 bg-surface text-primary shadow-glow"><M.icon className="h-8 w-8" /></span>
          <h1 className="mt-4 font-display text-3xl font-bold">{M.title}</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue to your MEDIVANCE {role} portal.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {err.form && <div role="alert" className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{err.form}</div>}
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="email" type="email" autoComplete="email" className="input pl-9" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" /></div>
            {err.email && <p className="err">{err.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="input px-9" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Your password" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-fg" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {err.password && <p className="err">{err.password}</p>}
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Remember me</label>
            <button type="button" onClick={() => { setFEmail(f.email); setForgot(true); }} className="font-semibold text-primary hover:underline">Forgot password?</button>
          </div>
          <button className="btn-primary w-full !py-3"><LogIn className="h-4 w-4" /> Sign in</button>
        </form>
        <button onClick={demo} className="btn-ghost mt-3 w-full">Fill demo {role} account</button>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <Link href="/login" className="hover:text-primary">&larr; Change role</Link>
          {role === "patient" && <span>New here? <Link href="/register" className="font-semibold text-primary hover:underline">Create account</Link></span>}
        </div>
        {role === "doctor" && isSupabaseConfigured && <button type="button" onClick={() => setRegister(true)} className="btn-gold mt-3 w-full">Create Account as a Doctor</button>}
        {!isSupabaseConfigured && <p className="mt-4 rounded-lg bg-primary/5 p-2.5 text-[11px] text-muted">Demo mode: login is simulated in your browser with LocalStorage and is not real security.</p>}
      </div>
      <ForgotPasswordModal key={String(forgot)} open={forgot} onClose={() => setForgot(false)} initialEmail={fEmail} />
      {role === "doctor" && isSupabaseConfigured && <DoctorRegisterForm open={register} onClose={() => setRegister(false)} />}
    </div>
  );
}
