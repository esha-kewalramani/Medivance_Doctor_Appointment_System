"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { isEmail } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/components/notifications/alerts";

/** Change the LOGIN e-mail through Supabase Auth (verification e-mail). Shown only when MEDIVANCE runs on Supabase. */
export default function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const { changeEmail } = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!isSupabaseConfigured) return null;

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    if (!isEmail(email)) { setMsg({ ok: false, text: "Enter a valid email address." }); return; }
    setBusy(true); setMsg(null);
    const r = await changeEmail(email);
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: r.error }); toast("error", "Could not change email", r.error); return; }
    if (r.verificationSent) {
      setMsg({ ok: true, text: `We sent a verification link to ${email.trim().toLowerCase()}. Your login email changes only after you open it (if Supabase also asks, confirm from your current address too).` });
      toast("success", "Verification email sent", email.trim());
    } else {
      setMsg({ ok: true, text: "Your email address was updated." });
      toast("success", "Email updated");
    }
    setEmail("");
  };

  return (
    <form onSubmit={submit} noValidate className="card h-fit space-y-3 p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Mail className="h-5 w-5 text-primary" /> Change email address</h2>
      <p className="text-xs text-muted">Current login email: <b className="text-fg">{currentEmail}</b></p>
      <div><label className="label" htmlFor="ce-new">New email address</label><input id="ce-new" type="email" autoComplete="email" className="input" value={email} onChange={(e) => { setEmail(e.target.value); setMsg(null); }} /></div>
      {msg && <p role="status" className={`rounded-lg p-2.5 text-xs ${msg.ok ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending..." : "Send verification email"}</button>
    </form>
  );
}
