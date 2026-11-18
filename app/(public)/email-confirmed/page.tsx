"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { getInitialAuthUrl } from "@/lib/supabase/client";
import { useApp } from "@/hooks/useApp";

/** Landing page after the user clicks the e-mail-change verification link (Supabase has already verified it). */
export default function EmailConfirmedPage() {
  const { session, ready } = useApp();
  const [failed, setFailed] = useState("");
  useEffect(() => {
    const init = getInitialAuthUrl();
    const p = new URLSearchParams(init.hash.replace(/^#/, ""));
    const q = new URLSearchParams(init.search);
    const d = p.get("error_description") || q.get("error_description");
    if (d) setFailed(/expired/i.test(d) ? "This verification link has expired. Please request the e-mail change again from your profile." : "This verification link is invalid or was already used.");
  }, []);
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-10">
      <div className="card w-full max-w-md space-y-4 p-6 text-center sm:p-8">
        {failed ? (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-bad/15 text-bad"><TriangleAlert className="h-8 w-8" /></span>
            <h1 className="font-display text-2xl font-bold">Link not valid</h1><p className="text-sm text-muted" role="alert">{failed}</p>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
            <h1 className="font-display text-2xl font-bold">Email confirmed</h1>
            <p className="text-sm text-muted">Thank you. If Supabase asked you to confirm from both your old and new address, the change completes after the second confirmation. Your MEDIVANCE profile and role are unchanged.</p>
          </>
        )}
        <Link href={ready && session ? `/${session.role}/${session.role === "admin" ? "settings" : "profile"}` : "/login"} className="btn-primary w-full">{ready && session ? "Back to my account" : "Go to sign in"}</Link>
      </div>
    </div>
  );
}
