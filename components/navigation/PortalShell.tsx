"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  BarChart3, Bot, CalendarCheck, CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, ClipboardList, Cog, LayoutDashboard, LogOut, Menu, Search, Sparkles,
  Stethoscope, Tags, User, UserCog, Users, Video, X, LucideIcon,
} from "lucide-react";
import AnimatedLogo from "@/components/branding/AnimatedLogo";
import Logo from "@/components/ui/Logo";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useApp } from "@/hooks/useApp";
import { Role } from "@/types";
import { toast } from "@/components/notifications/alerts";
import ApprovalGate from "@/components/doctors/ApprovalGate";

interface NavItem { href: string; label: string; icon: LucideIcon }
const NAV: Record<Role, NavItem[]> = {
  patient: [
    { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patient/doctors", label: "Find Doctors", icon: Stethoscope },
    { href: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
    { href: "/patient/appointments", label: "My Appointments", icon: CalendarCheck },
    { href: "/patient/video", label: "Video Consult", icon: Video },
    { href: "/patient/assistant", label: "AI Assistant", icon: Bot },
    { href: "/patient/profile", label: "Profile", icon: User },
  ],
  doctor: [
    { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/appointments", label: "Appointments", icon: CalendarCheck },
    { href: "/doctor/availability", label: "Availability", icon: CalendarClock },
    { href: "/doctor/patients", label: "Patient Records", icon: ClipboardList },
    { href: "/doctor/profile", label: "Profile", icon: User },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/admin/patients", label: "Patients", icon: Users },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
    { href: "/admin/specializations", label: "Specializations", icon: Tags },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Cog },
  ],
};
const SEARCH_TARGET: Record<Role, string> = { patient: "/patient/doctors", doctor: "/doctor/appointments", admin: "/admin/appointments" };
const TIP: Record<Role, { title: string; text: string; href: string; cta: string }> = {
  patient: { title: "AI Assistant", text: "Ask for doctor suggestions or booking help.", href: "/patient/assistant", cta: "Ask now" },
  doctor: { title: "Quick tip", text: "Keep your availability updated so patients see accurate slots.", href: "/doctor/availability", cta: "Update hours" },
  admin: { title: "Reports", text: "Export appointment data to CSV any time.", href: "/admin/reports", cta: "Open reports" },
};

export default function PortalShell({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, session, user, logout, theme } = useApp();
  const router = useRouter();
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [mini, setMini] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // protected, role-based route guard
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace(`/login/${role}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    else if (session.role !== role) { toast("warning", "Access restricted", `Your account cannot open the ${role} portal.`); router.replace(`/${session.role}`); }
    else if (!user) { logout(); router.replace(`/login/${role}`); }
  }, [ready, session, user, role, router, logout]);

  useEffect(() => { setDrawer(false); setMenu(false); }, [path]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (ready && session && role === "doctor" && session.role === "doctor" && session.approval && session.approval !== "approved") return <ApprovalGate status={session.approval} />;

  if (!ready || !session || session.role !== role || !user) {
    return <div className="grid min-h-screen place-items-center"><div className="flex flex-col items-center gap-3 text-muted"><span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />Loading your portal...</div></div>;
  }

  const items = NAV[role];
  const isActive = (h: string) => (h === `/${role}` ? path === h : path.startsWith(h));
  const doLogout = () => { logout(); toast("success", "Signed out", "See you soon!"); router.push("/"); };
  const tip = TIP[role];

  const Sidebar = ({ compact }: { compact: boolean }) => (
    <div className="flex h-full flex-col">
      <div className={`flex items-center ${compact ? "justify-center" : "justify-between"} px-1 pb-4`}>
        {compact ? <AnimatedLogo variant="icon" size={28} /> : <Logo size={30} />}
      </div>
      <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted ${compact ? "hidden" : ""}`}>{role} portal</p>
      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label={`${role} navigation`}>
        {items.map((i) => (
          <Link key={i.href} href={i.href} title={i.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${compact ? "justify-center" : ""} ${isActive(i.href) ? "bg-primary text-primary-fg shadow-glow" : "text-fg/80 hover:bg-primary/10 hover:text-primary"}`}>
            <i.icon className="h-5 w-5 shrink-0" />{!compact && i.label}
          </Link>
        ))}
      </nav>
      {!compact && (
        <div className="card mt-3 !rounded-2xl p-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent"><Sparkles className="h-4 w-4" /></span>
          <p className="mt-2 font-display font-semibold">{tip.title}</p>
          <p className="mt-0.5 text-xs text-muted">{tip.text}</p>
          <Link href={tip.href} className="btn-primary btn-sm mt-3 w-full">{tip.cta}</Link>
        </div>
      )}
      <button onClick={doLogout} title="Logout" className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-bad transition hover:bg-bad/10 ${compact ? "justify-center" : ""}`}><LogOut className="h-5 w-5" />{!compact && "Logout"}</button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className={`card portal-sidebar sticky top-3 self-start z-30 m-3 mr-0 hidden h-[calc(100vh-1.5rem)] shrink-0 !rounded-2xl p-3 transition-[width] duration-300 lg:block ${mini ? "w-[76px]" : "w-64"}`}>
        {Sidebar({ compact: mini })}
        <button onClick={() => setMini(!mini)} className="absolute -right-3 top-8 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-muted hover:text-primary" aria-label="Collapse sidebar">{mini ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
      </aside>
      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="card absolute left-0 top-0 h-full w-72 max-w-[85vw] animate-pop !rounded-none !bg-surface p-3">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 text-muted" aria-label="Close menu"><X className="h-5 w-5" /></button>
            {Sidebar({ compact: false })}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap sm:gap-3 sm:px-6">
          <button onClick={() => setDrawer(true)} className="card grid h-10 w-10 shrink-0 place-items-center !rounded-xl lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`${SEARCH_TARGET[role]}?q=${encodeURIComponent(q)}`); }} className="card relative h-10 min-w-0 flex-1 !rounded-xl" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={role === "patient" ? "Search doctors..." : "Search appointments..."} className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted" aria-label="Search" />
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenu(!menu)} className="card flex items-center gap-2 !rounded-xl py-1 pl-1 pr-3" aria-expanded={menu} aria-label="Account menu">
                <Avatar name={user.name} photo={user.photo} size={32} />
                <span className="hidden text-left leading-tight sm:block"><span className="block max-w-[140px] truncate text-sm font-semibold">{user.name}</span><span className="block text-[10px] capitalize text-muted">{role}</span></span>
              </button>
              {menu && (
                <div className="card absolute right-0 z-50 mt-2 w-52 animate-pop !bg-surface p-1.5 shadow-soft">
                  <Link href={role === "admin" ? "/admin/settings" : `/${role}/profile`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"><UserCog className="h-4 w-4" /> {role === "admin" ? "Settings" : "My profile"}</Link>
                  <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"><Stethoscope className="h-4 w-4" /> Public website</Link>
                  <button onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-bad hover:bg-bad/10"><LogOut className="h-4 w-4" /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main-content" className="px-3 pb-10 pt-2 sm:px-6" data-theme-view={theme}>{children}</main>
      </div>
    </div>
  );
}
