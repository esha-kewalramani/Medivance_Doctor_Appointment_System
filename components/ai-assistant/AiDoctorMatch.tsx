"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { suggestSpecialization } from "@/lib/ai/simulated";
import { useApp } from "@/hooks/useApp";

// Simulated "intelligent doctor search": keyword matching, clearly labelled as a demo.
export default function AiDoctorMatch({ onPick }: { onPick: (spec: string) => void }) {
  const { data } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ spec: string | null; asked: string } | null>(null);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setResult(null);
    setTimeout(() => { setResult({ spec: suggestSpecialization(text, data.specializations), asked: text }); setBusy(false); }, 700);
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent"><Sparkles className="h-4 w-4" /></span>
        <div>
          <h3 className="font-display font-semibold leading-tight">AI Doctor Match <span className="badge ml-1 border-accent/40 bg-accent/10 text-accent">Demo</span></h3>
          <p className="text-xs text-muted">Describe what you need in your own words (e.g. &quot;itchy skin rash&quot;).</p>
        </div>
      </div>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. knee pain when walking" aria-label="Describe your need" />
        <button className="btn-primary shrink-0" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Suggest</button>
      </form>
      {result && (
        <div className="mt-3 animate-pop rounded-xl border border-line/50 bg-primary/5 p-3 text-sm">
          {result.spec ? (
            <p>Suggested specialization: <button onClick={() => onPick(result.spec!)} className="badge cursor-pointer border-primary/40 bg-primary/15 text-primary hover:bg-primary hover:text-primary-fg">{result.spec} - show doctors</button></p>
          ) : <p>I could not match that to a specialization. Try different words or browse all doctors.</p>}
          <p className="mt-2 text-xs text-muted">Simulated keyword matching for the frontend demo. This is not a medical diagnosis; consult a qualified doctor.</p>
        </div>
      )}
    </div>
  );
}
