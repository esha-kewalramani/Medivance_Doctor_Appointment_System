"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Bot, CalendarCheck, HeartPulse, HelpCircle, Home, LayoutGrid, MapPin, Menu, Stethoscope, X, LucideIcon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useApp } from "@/hooks/useApp";

interface NavItem { label: string; href: string; icon: LucideIcon; match: (p: string) => boolean }

export default function PublicNavbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { session, logout } = useApp();
  const role = session?.role;

  const links: NavItem[] = [
    { label: "Home", href: "/", icon: Home, match: (p) => p === "/" },
    { label: "Inside", href: "/inside", icon: HelpCircle, match: (p) => p.startsWith("/inside") },
    { label: "Doctors", href: "/doctors", icon: Stethoscope, match: (p) => p.startsWith("/doctors") || p.startsWith("/patient/doctors") },
    { label: "Live Location", href: "/location", icon: MapPin, match: (p) => p.startsWith("/location") },
    { label: "Aura AI", href: "/aura-ai", icon: Bot, match: (p) => p.startsWith("/aura-ai") },
    { label: "Appointments", href: role ? `/${role}/appointments` : "/login/patient?next=/patient/appointments", icon: CalendarCheck, match: (p) => /^\/(patient|doctor|admin)\/appointments/.test(p) || (!role && p.startsWith("/login/")) },
    { label: "Workspace", href: "/login", icon: LayoutGrid, match: (p) => p === "/login" },
  ];

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="nav-shell mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Logo stacked size={34} />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {links.map((l) => {
            const on = l.match(path);
            return <Link key={l.label} href={l.href} className={`nav-link ${on ? "active" : ""}`} aria-current={on ? "page" : undefined}><l.icon className="h-4 w-4" />{l.label}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? <button onClick={logout} className="nav-login hidden sm:inline-flex">Logout</button> : <Link href="/login" className="nav-login hidden sm:inline-flex">Login</Link>}
          <Link href={session?.role === "patient" ? "/patient/book" : "/book"} className="nav-cta hidden sm:inline-flex">Book now <ArrowUpRight className="h-4 w-4" /></Link>
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <div className="nav-shell mx-auto mt-2 max-w-[1400px] animate-pop p-3 lg:hidden">
          {links.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={`nav-link !px-3 !py-3 ${l.match(path) ? "active" : ""}`}><l.icon className="h-4 w-4" />{l.label}</Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line/40 pt-3">
            {session ? <button onClick={() => { logout(); setOpen(false); }} className="nav-login">Logout</button> : <Link href="/login" onClick={() => setOpen(false)} className="nav-login">Login</Link>}
            <Link href={session?.role === "patient" ? "/patient/book" : "/book"} onClick={() => setOpen(false)} className="nav-cta">Book now <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      )}
    </header>
  );
}
