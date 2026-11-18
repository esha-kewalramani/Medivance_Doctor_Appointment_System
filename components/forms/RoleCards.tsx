"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HeartPulse, Settings, Stethoscope, Syringe, UserRound, ShieldPlus } from "lucide-react";

const ROLES = [
  { role: "patient", title: "Patient", icon: UserRound, badge: HeartPulse, desc: "Book appointments, manage your health and access medical records.", items: ["Find Doctors", "Book Appointments", "View Medical History", "Track Your Health"] },
  { role: "doctor", title: "Doctor", icon: Stethoscope, badge: Stethoscope, desc: "Manage your appointments, patients and professional profile.", items: ["View Appointments", "Manage Patients", "Update Availability", "Access Patient Records"] },
  { role: "admin", title: "Admin", icon: UserRound, badge: Settings, desc: "Manage the platform, users and system settings.", items: ["Manage Doctors", "Manage Patients", "View Analytics", "System Settings"] },
] as const;

export default function RoleCards() {
  return (
    <section className="container-x pt-10 sm:pt-14">
      <div className="relative mb-10 text-center">
        <ShieldPlus className="absolute left-0 top-1/2 hidden h-20 w-20 -translate-y-1/2 text-primary/60 drop-shadow-[0_0_14px_rgb(var(--primary)/0.5)] lg:block" strokeWidth={1.2} />
        <Syringe className="absolute right-0 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-primary/50 lg:block" strokeWidth={1.2} />
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-primary sm:block" />
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Select Your <span className="text-primary">Role</span></h1>
          <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-primary sm:block" />
        </div>
        <p className="mt-3 text-sm text-fg/80">Choose how you want to continue with <b className="text-primary">MEDIVANCE</b></p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.role} className="card card-hover relative flex flex-col items-center px-6 pb-6 pt-14 text-center">
            <span className="absolute -top-10 grid h-20 w-20 place-items-center rounded-full border-2 border-primary/70 bg-surface text-primary shadow-glow">
              <r.icon className="h-10 w-10" strokeWidth={1.6} />
              <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-fg"><r.badge className="h-3.5 w-3.5" /></span>
            </span>
            <h2 className="font-display text-2xl font-bold">{r.title}</h2>
            <p className="mt-2 min-h-[48px] text-sm text-fg/80">{r.desc}</p>
            <ul className="mt-4 w-full space-y-2 text-left text-sm">
              {r.items.map((i) => <li key={i} className="flex items-center gap-2.5"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{i}</li>)}
            </ul>
            <Link href={`/login/${r.role}`} className="btn-primary mt-6 w-full">Continue as {r.title} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
