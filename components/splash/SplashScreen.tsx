"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Stethoscope, MapPin, Calendar, Heart, Activity } from "lucide-react";

// Two separate screens, shown strictly one after the other (never mounted together):
//   Screen 1 (logo-reveal.webp, the logo reveal animation) -> plays once (~3s), then fades out and is removed
//   Screen 2 (splash-ultra-hd.jpg + animations) -> mounts only after screen 1 is gone, then fades out
const SCREEN1_MS = 1100; // first screen visible time (animation timeline fits inside 2.5s)
const SCREEN2_MS = 2500; // second screen visible time
const FADE_MS = 250;

type Phase = "one" | "one-out" | "two" | "two-out" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("one");
  const [oneReady, setOneReady] = useState(false); // screen 1 mounted -> start its clock
  const [quick, setQuick] = useState<boolean | null>(null); // true on refresh / repeat visit: screen 1 only, stay on the current page
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    let quickType = false; // refresh / back-forward -> first splash only; a fresh visit shows both
    try { const t = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type; quickType = t === "reload" || t === "back_forward"; } catch { /* ignore */ }
    setQuick(quickType);
  }, []);

  useEffect(() => {
    if (quick === null) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (phase === "one") t = setTimeout(() => (oneReady ? setPhase("one-out") : setOneReady(true)), oneReady ? SCREEN1_MS : 300); // 2500ms = safety net if the image is slow
    else if (phase === "one-out") t = setTimeout(() => setPhase(quick ? "two-out" : "two"), FADE_MS);
    else if (phase === "two") t = setTimeout(() => setPhase("two-out"), SCREEN2_MS);
    else if (phase === "two-out") {
      if (!quick && path !== "/") router.replace("/");
      t = setTimeout(() => setPhase("done"), FADE_MS);
    }
    return () => { if (t) clearTimeout(t); };
  }, [phase, oneReady, path, router, quick]);

  // Lock scroll while splash is active
  useEffect(() => {
    if (phase === "done") return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  if (phase === "done") return null;

  const skip = () => setPhase("two-out");

  return (
    <aside
      className="fixed inset-0 z-[300] h-screen w-screen select-none overflow-hidden bg-[#020917]"
      style={{
        opacity: phase === "two-out" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        pointerEvents: phase === "two-out" ? "none" : "auto",
      }}
      aria-label="MEDIVANCE Welcome Screen"
    >
      {(phase === "one" || phase === "one-out") && <div className="absolute inset-0" style={{ opacity: phase === "one-out" ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}><ScreenOne onReady={() => setOneReady(true)} /></div>}
      {!quick && (phase === "two" || phase === "two-out") && <ScreenTwo />}

      <button
        onClick={skip}
        className="group absolute right-5 top-5 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#030d22]/85 px-4 py-2 text-xs font-semibold text-white/95 shadow-xl backdrop-blur-md transition-all hover:border-sky-400/70 hover:bg-[#07193f] sm:right-8 sm:top-6"
        aria-label="Skip to Homepage"
      >
        <span>Skip</span>
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>

      <style jsx global>{`
        @keyframes sp-pop { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: scale(1) } }
        @keyframes sp-up { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: none } }
        @keyframes sp-letters { from { opacity: 0; letter-spacing: .6em } to { opacity: 1; letter-spacing: .22em } }
        @keyframes sp-halo { 0%,100% { transform: scale(.92); opacity: .3 } 50% { transform: scale(1.15); opacity: .7 } }
        @keyframes sp-draw { from { stroke-dashoffset: 1800 } to { stroke-dashoffset: 0 } }
        @keyframes sp-bar { from { width: 0 } to { width: 100% } }
        @keyframes sp-zoom { from { transform: scale(1.12); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes sp-pill { from { opacity: 0; transform: translateY(18px) scale(.9) } to { opacity: 1; transform: none } }
        @keyframes sp-light { 0% { box-shadow: none } 100% { box-shadow: 0 0 15px rgba(56,189,248,.45) } }
      `}</style>
    </aside>
  );
}

/* ---------------- Screen 1: vector logo reveal (~3s, pure CSS/SVG so it stays sharp on any display) ---------------- */
function ScreenOne({ onReady }: { onReady: () => void }) {
  const [showLogo, setShowLogo] = useState(false);
  useEffect(() => {
    onReady();
    const t = setTimeout(() => setShowLogo(true), 450); // emblem rises at 0.45s
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rings = [90, 150, 215, 285, 360];
  return (
    <div className="sp1" role="img" aria-label="MEDIVANCE - Where Care Meets Tomorrow.">
      <div className="sp1-stage">
        <div className="sp1-glow" />
        <svg className="sp1-rings" viewBox="0 0 1100 700" fill="none" aria-hidden>
          {rings.map((r, i) => (
            <ellipse key={r} className="sp1-ring" cx="550" cy="440" rx={r * 1.3} ry={r * 0.3} stroke={i === 2 ? "#f5c04a" : "#4cc3ff"} strokeWidth={i === 2 ? 2.5 : 2} style={{ animationDelay: `${0.3 + i * 0.08}s`, opacity: 0 }} />
          ))}
        </svg>
        <div className="sp1-beam" />
        {showLogo && (
          <div className="sp1-logo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/logo-full.png" alt="MEDIVANCE" width={1500} height={645} className="sp1-logo-img" draggable={false} /></div>
        )}
        <div className="sp1-tag">Where Care Meets Tomorrow.</div>
      </div>
    </div>
  );
}

/* ---------------- Screen 2: care network ---------------- */
const PILLS = [
  { label: "Find Doctors", icon: Stethoscope },
  { label: "Track Location", icon: MapPin },
  { label: "Book Appointments", icon: Calendar },
  { label: "Manage Health", icon: Heart },
];

function ScreenTwo() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((performance.now() - start) / SCREEN2_MS) * 100));
      setProgress(p);
      if (p >= 100) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/splash/splash-ultra-hd.jpg" alt="MEDIVANCE Medical Center" className="absolute inset-0 h-full w-full object-cover object-center" style={{ animation: `sp-zoom ${SCREEN2_MS}ms ease-out both`, filter: "contrast(1.05) saturate(1.1)" }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020817]/85 via-transparent to-[#020817]/40" />


      <div className="absolute inset-x-0 bottom-36 z-20 flex flex-col items-center px-4 text-center sm:bottom-40">
        <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {PILLS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="inline-flex items-center gap-2 rounded-full border border-sky-400 bg-sky-500/25 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
              style={{ animation: `sp-pill .5s ${0.5 + i * 0.5}s ease-out both, sp-light .4s ${0.5 + i * 0.5}s ease-out both` }}>
              <Icon className="h-3.5 w-3.5 text-sky-300" /><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-20 mx-auto max-w-md px-6 sm:bottom-10">
        <div className="flex items-center justify-between pb-2 text-xs font-medium text-sky-200/95">
          <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 animate-pulse text-sky-400" />{progress < 60 ? "Connecting Healthcare Network..." : "Welcome to MEDIVANCE"}</span>
          <span className="font-mono font-bold text-sky-300">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-sky-400/40 bg-[#010918]/90 p-[1px]">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-400" style={{ width: `${progress}%`, boxShadow: "0 0 14px #38bdf8" }} />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-wider text-sky-300/80">Loading Your Healthier Tomorrow...</p>
      </div>
    </div>
  );
}
