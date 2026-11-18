"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, TriangleAlert } from "lucide-react";
import { getInitialAuthUrl, getSupabase } from "@/lib/supabase/client";
import { passwordIssue } from "@/lib/validation";

type State = "checking" | "ready" | "invalid" | "done" | "demo";
const FLAG = "mdv_recovery"; // survives a page refresh while the recovery session is active; never contains a token

/** Landing page of the password-reset e-mail. Supabase Auth validates the link; this page only lets the user choose the new password. */
export default function ResetPasswordForm() {
  const sb = getSupabase();
  const [state, setState] = useState<State>(sb ? "checking" : "demo");
  const [reason, setReason] = useState("");
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sb) return;
    let off = false;
    const init = getInitialAuthUrl();
    const hash = new URLSearchParams(init.hash.replace(/^#/, ""));
    const qs = new URLSearchParams(init.search);
    const errCode = hash.get("error_code") || qs.get("error_code") || "";
    const errDesc = hash.get("error_description") || qs.get("error_description") || "";
    const bad = (msg: string) => { if (!off) { setReason(msg); setState("invalid"); } };

    if (errDesc || errCode) { bad(/expired/i.test(errDesc + errCode) ? "This password-reset link has expired." : "This password-reset link is invalid or has already been used."); return; }

    const { data: sub } = sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY" && !off) { sessionStorage.setItem(FLAG, "1"); setState("ready"); } });
    (async () => {
      const code = qs.get("code");
      const fromLink = hash.get("type") === "recovery" || Boolean(code);
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) { const { data } = await sb.auth.getSession(); if (!data.session) { bad("This password-reset link is invalid or has expired."); return; } }
        sessionStorage.setItem(FLAG, "1"); if (!off) setState("ready"); return;
      }
      // implicit flow: supabase-js already consumed #access_token on start-up. Give it a moment, then look for the session.
      for (let i = 0; i < 8 && !off; i++) {
        const { data } = await sb.auth.getSession();
        if (data.session && (fromLink || sessionStorage.getItem(FLAG))) { sessionStorage.setItem(FLAG, "1"); setState("ready"); return; }
        await new Promise((r) => setTimeout(r, 400));
      }
      bad("This page can only be opened from the password-reset e-mail. Please request a new link.");
    })();
    return () => { off = true; sub.subscription.unsubscribe(); };
  }, [sb]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!sb || busy) return;
    const issue = passwordIssue(pw.next);
    if (issue) { setErr(issue); return; }
    if (pw.next !== pw.confirm) { setErr("Passwords do not match."); return; }
    setErr(""); setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw.next });
    if (error) {
      setBusy(false);
      if (/expired|invalid|jwt|session|not authenticated/i.test(error.message)) { setReason("Your reset session has expired. Please request a new link."); setState("invalid"); return; }
      setErr(/same|different/i.test(error.message) ? "Choose a password you have not used before." : error.message);
      return;
    }
    sessionStorage.removeItem(FLAG);
    await sb.auth.signOut(); // the user signs in again with the new password
    setBusy(false); setPw({ next: "", confirm: "" }); setState("done");
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6 sm:p-8">
        {state === "checking" && <div className="flex flex-col items-center gap-3 py-8 text-muted"><span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />Checking your reset link...</div>}

        {state === "demo" && <p className="py-6 text-center text-sm text-muted">Password recovery is available when MEDIVANCE is connected to Supabase. <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link></p>}

        {state === "invalid" && (
          <div className="space-y-4 text-center" role="alert">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-bad/15 text-bad"><TriangleAlert className="h-8 w-8" /></span>
            <h1 className="font-display text-2xl font-bold">Link not valid</h1>
            <p className="text-sm text-muted">{reason}</p>
            <Link href="/login" className="btn-primary w-full">Go to sign in and use &quot;Forgot password?&quot;</Link>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
            <h1 className="font-display text-2xl font-bold">Password updated</h1>
            <p className="text-sm text-muted">Your password was changed successfully. Please sign in with your new password.</p>
            <Link href="/login" className="btn-primary w-full">Continue to sign in</Link>
          </div>
        )}

        {state === "ready" && (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-primary/70 bg-surface text-primary shadow-glow"><KeyRound className="h-8 w-8" /></span>
              <h1 className="mt-4 font-display text-3xl font-bold">Choose a new password</h1>
              <p className="mt-1 text-sm text-muted">Use at least 8 characters with letters and numbers.</p>
            </div>
            {err && <div role="alert" className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{err}</div>}
            <div><label className="label" htmlFor="rp-new">New password</label>
              <div className="relative"><input id="rp-new" type={show ? "text" : "password"} autoComplete="new-password" className="input pr-10" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted" aria-label="Toggle password visibility">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <div><label className="label" htmlFor="rp-cf">Confirm new password</label><input id="rp-cf" type={show ? "text" : "password"} autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
            <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? "Saving..." : "Update password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
