"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, CalendarDays, FileText, Lock, Phone, ShieldCheck, Siren, Zap, HeartPulse, Maximize2, MessagesSquare, Minimize2, Pill, Send, Sparkles, Stethoscope, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { emergencyReply } from "@/lib/emergencyChat";
import { auraReply, BotReply } from "@/lib/ai/simulated";

interface Msg { id: number; from: "bot" | "me"; text: string; links?: BotReply["links"] }

const TILES = [
  { id: "doctor", label: "Find a Doctor", icon: Stethoscope, prompt: "Find me a doctor" },
  { id: "book", label: "Book Appointment", icon: CalendarDays, prompt: "How do I book an appointment?" },
  { id: "report", label: "Explain My Report", icon: FileText, prompt: "Explain my report" },
  { id: "tips", label: "Health Tips", icon: HeartPulse, prompt: "Health tips" },
  { id: "symptom", label: "Symptom Guidance", icon: Pill, prompt: "Symptom guidance" },
  { id: "general", label: "General Questions", icon: MessagesSquare, prompt: "General questions" },
];

export default function AuraAI() {
  const { data } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [voice, setVoice] = useState(false);
  const [full, setFull] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, typing]);
  useEffect(() => { if (!full) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setFull(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [full]);

  const send = (t: string, tile?: string) => {
    const v = t.trim();
    if (!v || typing) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text: v }]);
    setText(""); setTyping(true);
    setTimeout(() => {
      const r = auraReply(v, data.doctors, data.specializations, tile);
      setMsgs((m) => [...m, { id: Date.now() + 1, from: "bot", text: r.text, links: r.links }]);
      setTyping(false);
      if (voice) { try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(r.text.replace(/•/g, ""))); } catch { /* unsupported */ } }
    }, 800);
  };
  const toggleVoice = () => { if (voice) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } } setVoice(!voice); };
  const compact = msgs.length > 0;

  const [em, setEm] = useState<{ id: number; from: "bot" | "me"; text: string }[]>([]);
  const [emText, setEmText] = useState("");
  const [emTyping, setEmTyping] = useState(false);
  const emEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { emEnd.current?.scrollIntoView({ block: "nearest" }); }, [em, emTyping]);
  const emSend = (t: string) => {
    const v = t.trim();
    if (!v || emTyping) return;
    setEm((m) => [...m, { id: Date.now(), from: "me", text: v }]);
    setEmText(""); setEmTyping(true);
    setTimeout(() => { setEm((m) => [...m, { id: Date.now() + 1, from: "bot", text: emergencyReply(v).text }]); setEmTyping(false); }, 600);
  };
  const openEmergency = () => window.dispatchEvent(new Event("mdv:emergency"));
  return (
    <section className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <svg viewBox="0 0 120 30" className="hidden h-6 w-24 text-primary sm:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M0 16h40l6-12 8 24 8-18 6 6h52" /></svg>
          <HeartPulse className="h-12 w-12 text-primary drop-shadow-[0_0_8px_rgb(var(--primary)/0.5)] sm:h-14 sm:w-14" strokeWidth={1.6} />
          <h1 className="font-display text-4xl font-bold sm:text-5xl md:text-6xl">Aura <span className="text-primary">AI</span></h1>
          <svg viewBox="0 0 120 30" className="hidden h-6 w-24 text-primary sm:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M0 16h40l6-12 8 24 8-18 6 6h52" /></svg>
        </div>
        <p className="mt-3 font-display text-xl font-semibold sm:text-2xl">Your Intelligent Health Companion</p>
        <p className="mt-1 text-sm font-medium tracking-wide text-primary">Ask &bull; Learn &bull; Get Guidance &bull; Take Action</p>
      </header>

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        {/* Emergency Assistance (chat) */}
        <div className="card relative isolate flex min-h-[620px] flex-col overflow-hidden !rounded-3xl p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/emergency-hospital.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-bottom" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface via-surface/90 via-30% to-black/35" />
          <div className="p-5 pb-2 sm:p-6 sm:pb-2">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-red-600 text-white shadow-[0_0_26px_rgba(239,68,68,.6)]"><Siren className="h-7 w-7" /></span>
              <h2 className="font-display text-3xl font-bold leading-[1.05] sm:text-4xl"><span className="text-red-600 dark:text-red-400">Emergency</span> Assistance</h2>
            </div>
            <p className="mt-3 text-sm text-muted sm:text-base"><b className="text-fg">Need urgent medical help?</b> Tell me what is happening. I will guide you step by step.</p>
          </div>

          <div className="mx-4 flex flex-col rounded-2xl border border-white/25 bg-black/40 p-3 text-white backdrop-blur-md sm:mx-5">
            <div className="max-h-[260px] min-h-[130px] space-y-2.5 overflow-y-auto pr-1 text-sm" aria-live="polite">
              <div className="flex items-start gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-600"><Siren className="h-4 w-4" /></span><p className="rounded-2xl bg-white/10 px-3 py-2">I am your emergency assistant. What is happening? For example: <i>&quot;I am feeling heavy chest pain&quot;</i>.</p></div>
              {em.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
                  <p className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 ${m.from === "me" ? "bg-red-600" : "bg-white/10"}`}>{m.text}</p>
                </div>
              ))}
              {emTyping && <div className="flex gap-1 pl-10">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-dots rounded-full bg-red-400" style={{ animationDelay: `${i * 0.2}s` }} />)}</div>}
              <div ref={emEnd} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Heavy chest pain", "Cannot breathe", "Heavy bleeding", "Stroke signs", "Burn", "Fainted"].map((c) => (
                <button key={c} onClick={() => emSend(c === "Heavy chest pain" ? "I am feeling heavy chest pain" : c)} disabled={emTyping} className="rounded-full border border-white/30 px-2.5 py-1 text-xs font-medium hover:bg-white/15 disabled:opacity-50">{c}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); emSend(emText); }} className="mt-2 flex items-center gap-2 rounded-full border border-white/30 bg-white/10 py-1 pl-3 pr-1">
              <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60" value={emText} onChange={(e) => setEmText(e.target.value)} placeholder="Describe the emergency..." aria-label="Describe the emergency" />
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-600 disabled:opacity-50" disabled={emTyping || !emText.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
          </div>

          <div className="mt-auto p-4 pt-10 sm:p-5 sm:pt-10">
            <div className="grid grid-cols-3 divide-x divide-white/20 rounded-2xl border border-white/20 bg-black/45 text-center text-[10px] font-semibold text-white backdrop-blur-sm sm:text-xs md:text-sm">
              <a href="tel:115" className="flex flex-col items-center gap-1 px-1 py-2 sm:px-2 sm:py-2.5 hover:bg-white/10"><Phone className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />Call Emergency Services</a>
              <Link href="/location" className="flex flex-col items-center gap-1 px-1 py-2 sm:px-2 sm:py-2.5 hover:bg-white/10"><Building2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />Find Nearby Hospitals</Link>
              <button onClick={openEmergency} className="flex flex-col items-center gap-1 px-1 py-2 sm:px-2 sm:py-2.5 hover:bg-white/10"><ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />Ambulance Numbers</button>
            </div>
          </div>
        </div>

        {/* Doctor image + chat */}
        <div className={`card flex flex-col overflow-hidden !rounded-3xl p-0 ${full ? "fixed inset-3 z-[60] overflow-auto" : ""}`}>
          <div className="aura-img relative h-60 shrink-0 overflow-hidden sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/aura-doctor.jpg" alt="Aura AI healthcare assistant" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
            <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 divide-x divide-white/20 rounded-xl border border-white/25 bg-black/55 text-center text-[9px] font-semibold leading-tight text-white backdrop-blur-sm sm:text-[11px]">
              <span className="flex items-center justify-center gap-1 px-1 py-1.5 sm:gap-1.5 sm:px-1.5 sm:py-2"><ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />Trusted &amp; Secure</span>
              <span className="flex items-center justify-center gap-1 px-1 py-1.5 sm:gap-1.5 sm:px-1.5 sm:py-2"><Lock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />Your Privacy Our Priority</span>
              <span className="flex items-center justify-center gap-1 px-1 py-1.5 sm:gap-1.5 sm:px-1.5 sm:py-2"><Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />Instant Assistance</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><HeartPulse className="h-6 w-6 text-primary" /> Aura AI <span className="text-sm font-semibold text-ok">&mdash; Online</span></p>
              <div className="flex gap-1 text-muted">
                <button onClick={toggleVoice} className="rounded-lg p-1.5 hover:bg-primary/10 hover:text-primary" aria-label={voice ? "Turn voice off" : "Read answers aloud"} aria-pressed={voice}>{voice ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>
                <button onClick={() => setFull(!full)} className="rounded-lg p-1.5 hover:bg-primary/10 hover:text-primary" aria-label={full ? "Exit full screen" : "Full screen"}>{full ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}</button>
              </div>
            </div>

            <div className={`space-y-4 overflow-y-auto pr-1 ${full ? "flex-1" : "min-h-[220px] max-h-[340px] flex-1"}`} aria-live="polite">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary"><HeartPulse className="h-5 w-5" /></span>
                <div className="rounded-2xl border border-line/50 bg-primary/5 px-4 py-3 text-sm sm:text-base">
                  <p>Hello! I&apos;m <b>Aura AI</b> &#10024;</p><p>Your personal healthcare assistant.</p><p>How can I help you today?</p>
                </div>
              </div>
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.from === "me" ? "bg-primary text-primary-fg" : "border border-line/50 bg-primary/5"}`}>
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.links && <div className="mt-2 flex flex-wrap gap-2">{m.links.map((l) => <Link key={l.href + l.label} href={l.href} className="btn-ghost btn-sm">{l.label}</Link>)}</div>}
                  </div>
                </div>
              ))}
              {typing && <div className="flex gap-1 pl-14">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-dots rounded-full bg-primary" style={{ animationDelay: `${i * 0.2}s` }} />)}</div>}
              <div ref={endRef} />
            </div>

            <div className={`mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 ${compact ? "text-xs" : "text-sm"}`}>
              {TILES.map((t) => (
                <button key={t.id} onClick={() => send(t.prompt, t.id)} disabled={typing} className={`flex flex-col items-center gap-2 rounded-2xl border border-line/60 bg-primary/5 px-2 text-center font-medium transition hover:border-primary hover:bg-primary/10 disabled:opacity-60 ${compact ? "py-2.5" : "py-4"}`}>
                  <t.icon className={`${compact ? "h-5 w-5" : "h-7 w-7"} text-primary`} />{t.label}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-4 flex items-center gap-3 rounded-full border border-line/60 bg-surface/50 py-1.5 pl-4 pr-1.5">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." aria-label="Type your message" />
              <button className="btn-primary !h-10 !w-10 shrink-0 !rounded-full !p-0" disabled={typing || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
            <p className="mt-3 text-[11px] text-muted">Aura AI is a simulated demo assistant. It gives general guidance only, never a diagnosis. In an emergency, contact local emergency services.</p>
          </div>
        </div>
      </div>
      <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">Smarter Care. Healthier Tomorrow.</p>
    </section>
  );
}
