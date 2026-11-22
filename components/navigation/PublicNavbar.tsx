"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Bot, CalendarCheck, HelpCircle, Home, LayoutGrid, MapPin, Menu, Stethoscope, X, LucideIcon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useApp } from "@/hooks/useApp";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
}

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
    { label: "Appointments", href: role ? `/${role}/appointments` : "/book", icon: CalendarCheck, match: (p) => p.startsWith("/book") || /^\/(patient|doctor|admin)\/appointments/.test(p) },
    { label: "Workspace", href: "/workspace", icon: LayoutGrid, match: (p) => p.startsWith("/workspace") || p === "/login" },
  ];

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-6 sm:pt-3">
      <div className="nav-shell mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5">
        <div className="shrink-0">
          <Logo stacked size={32} />
        </div>

        <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex" aria-label="Main">
          {links.map((l) => {
            const on = l.match(path);
            return (
              <Link
                key={l.label}
                href={l.href}
                className={`nav-link text-xs xl:text-sm px-2 py-1.5 xl:px-2.5 xl:py-1.5 ${on ? "active" : ""}`}
                aria-current={on ? "page" : undefined}
              >
                <l.icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0" />
                <span className="whitespace-nowrap">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          {session ? (
            <button onClick={logout} className="nav-login !hidden sm:!inline-flex">Logout</button>
          ) : (
            <Link href="/workspace" className="nav-login !hidden sm:!inline-flex">Login</Link>
          )}
          <Link
            href={session?.role === "patient" ? "/patient/book" : "/book"}
            className="nav-cta !hidden sm:!inline-flex"
          >
            <span className="whitespace-nowrap">Book now</span> <ArrowUpRight className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </Link>
          <button
            className="btn-ghost h-8 w-8 sm:h-9 sm:w-9 p-0 flex items-center justify-center rounded-xl shrink-0 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-shell mx-auto mt-2 max-w-[1400px] animate-pop p-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`nav-link !flex w-full items-center gap-3 !px-3 !py-2.5 rounded-xl ${l.match(path) ? "active" : ""}`}
              >
                <l.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{l.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/40 pt-3">
            {session ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="nav-login w-full justify-center !flex"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/workspace"
                onClick={() => setOpen(false)}
                className="nav-login w-full justify-center !flex"
              >
                Login
              </Link>
            )}
            <Link
              href={session?.role === "patient" ? "/patient/book" : "/book"}
              onClick={() => setOpen(false)}
              className="nav-cta w-full justify-center !flex"
            >
              <span>Book now</span> <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
