import Link from "next/link";
import { Facebook, Info, LayoutGrid, Route, Search, ShieldCheck, Stethoscope, User, UserPlus, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="mt-20 px-3 pb-6 sm:px-6">
      <div className="card mx-auto max-w-7xl p-6 sm:p-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo size={36} tagline />
            <p className="mt-4 text-sm text-muted">AI-powered appointment booking that connects patients, doctors and hospital administrators in one place.</p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((I, i) => (
                <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary transition hover:bg-primary hover:text-primary-fg"><I className="h-4 w-4" /></span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/doctors"><Search className="h-4 w-4 text-primary" strokeWidth={2.6} /> Find Doctors</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/#specializations"><LayoutGrid className="h-4 w-4 text-primary" strokeWidth={2.6} /> Specializations</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/#how-it-works"><Route className="h-4 w-4 text-primary" strokeWidth={2.6} /> How It Works</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/about"><Info className="h-4 w-4 text-primary" strokeWidth={2.6} /> About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold">Portals</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/login/patient"><User className="h-4 w-4 text-primary" strokeWidth={2.6} /> Patient Login</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/login/doctor"><Stethoscope className="h-4 w-4 text-primary" strokeWidth={2.6} /> Doctor Login</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/login/admin"><ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2.6} /> Admin Login</Link></li>
              <li><Link className="inline-flex items-center gap-2 hover:text-primary" href="/register"><UserPlus className="h-4 w-4 text-primary" strokeWidth={2.6} /> Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" strokeWidth={2.6} /> +92 300 123 4567</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" strokeWidth={2.6} /> info@medivance.pk</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" strokeWidth={2.6} /> Hyderabad, Sindh, Pakistan</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line/40 pt-4 text-xs text-muted sm:flex-row">
          <span>&copy; {new Date().getFullYear()} MEDIVANCE. All rights reserved.</span>
          <span>University project - frontend demonstration with sample data. Not a substitute for professional medical advice.</span>
        </div>
      </div>
    </footer>
  );
}
