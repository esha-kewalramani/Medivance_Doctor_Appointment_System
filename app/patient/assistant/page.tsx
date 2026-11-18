"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldAlert, User } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useApp } from "@/hooks/useApp";
import { assistantReply, BotReply, SUGGESTED_QUESTIONS } from "@/lib/ai/simulated";

interface Msg { id: number; from: "bot" | "me"; text: string; links?: BotReply["links"] }

export default function AssistantPage() {
  const { data, user } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: `Hi ${user?.name.split(" ")[0] ?? "there"}! I'm your MEDIVANCE assistant. Ask me about finding doctors, booking, cancelling or using the website.` }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, typing]);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || typing) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text: v }]);
    setText(""); setTyping(true);
    setTimeout(() => {
      const r = assistantReply(v, data.doctors, data.specializations);
      setMsgs((m) => [...m, { id: Date.now() + 1, from: "bot", text: r.text, links: r.links }]);
      setTyping(false);
    }, 800);
  };

  return (
    <>
      <PageHeader title="AI Patient Assistant" subtitle="Simulated assistant for the frontend demo." />
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-xs text-warn"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>This assistant uses scripted responses and does not provide medical diagnosis or treatment advice. In an emergency, contact local emergency services.</span></div>
      <div className="card flex h-[calc(100vh-17rem)] min-h-[420px] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${m.from === "me" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>{m.from === "me" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</span>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${m.from === "me" ? "bg-primary text-primary-fg" : "border border-line/50 bg-primary/5"}`}>
                <p className="whitespace-pre-line">{m.text}</p>
                {m.links && <div className="mt-2 flex flex-wrap gap-2">{m.links.map((l) => <Link key={l.href + l.label} href={l.href} className="btn-ghost btn-sm">{l.label}</Link>)}</div>}
              </div>
            </div>
          ))}
          {typing && <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary"><Bot className="h-4 w-4" /></span><div className="flex gap-1 rounded-2xl border border-line/50 bg-primary/5 px-4 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-dots rounded-full bg-primary" style={{ animationDelay: `${i * 0.2}s` }} />)}</div></div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-line/40 p-3">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{SUGGESTED_QUESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="badge shrink-0 cursor-pointer border-line/60 py-1.5 hover:border-primary hover:text-primary">{s}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about doctors, booking, appointments..." aria-label="Message" />
            <button className="btn-primary shrink-0" disabled={typing || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      </div>
    </>
  );
}
