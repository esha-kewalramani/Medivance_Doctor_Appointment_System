"use client";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/hooks/useApp";
import { isEmail } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/components/notifications/alerts";

/** Supabase sends the reset e-mail; the link opens /reset-password. In demo mode nothing is sent (as before). */
export default function ForgotPasswordModal({ open, onClose, initialEmail }: { open: boolean; onClose: () => void; initialEmail: string }) {
  const { requestPasswordReset } = useApp();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const close = () => { if (busy) return; setSent(false); setErr(""); onClose(); };
  const send = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    if (!isEmail(email)) { setErr("Enter a valid email address."); return; }
    setErr("");
    if (!isSupabaseConfigured) { setSent(true); toast("success", "Reset link sent (demo)", email); return; }
    setBusy(true);
    const r = await requestPasswordReset(email);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setSent(true);
  };

  return (
    <Modal open={open} onClose={close} title="Reset your password">
      {sent ? (
        <div className="space-y-3 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok"><MailCheck className="h-7 w-7" /></span>
          <p className="text-sm">If <b>{email.trim()}</b> belongs to a MEDIVANCE account, a password-reset link is on its way.{isSupabaseConfigured ? "" : " (Interface demo - no email is sent.)"}</p>
          <p className="text-xs text-muted">The link works once and expires after a short time. Check your spam folder if you do not see it.</p>
          <button className="btn-primary w-full" onClick={close}>Done</button>
        </div>
      ) : (
        <form onSubmit={send} noValidate>
          <p className="mb-3 text-sm text-muted">Enter your registered email address and we will send you a secure link to choose a new password.</p>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@example.com" aria-label="Email for reset" />
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn-primary mt-4 w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
        </form>
      )}
    </Modal>
  );
}
