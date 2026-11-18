import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata = { title: "Page not found - MEDIVANCE" };

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center px-4 py-12">
      <div className="card w-full max-w-xl p-8 text-center sm:p-10">
        <div className="flex justify-center"><Logo size={36} tagline /></div>
        {/* flat-line heartbeat that spikes into the "0" of 404 */}
        <svg viewBox="0 0 400 90" className="mx-auto mt-6 h-24 w-full max-w-md text-primary" fill="none" role="img" aria-label="Flat heartbeat line">
          <path className="nf-line" d="M0 55 H120 L135 55 L145 20 L157 80 L168 10 L180 70 L190 55 H400" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={100} />
        </svg>
        <p className="font-display text-6xl font-extrabold tracking-wider sm:text-7xl">4<span className="text-primary">0</span>4</p>
        <h1 className="mt-2 font-display text-2xl font-bold">This page has no pulse</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">The page you are looking for was moved, removed or never existed. Let's get you back to care.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          <Link href="/doctors" className="btn-ghost"><Stethoscope className="h-4 w-4" /> Find doctors</Link>
        </div>
      </div>
    </main>
  );
}
