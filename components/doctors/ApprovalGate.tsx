"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw, ShieldX } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/components/notifications/alerts";

/** Shown instead of the doctor dashboard until an admin approves the account. The database also blocks all doctor data for these accounts. */
export default function ApprovalGate({ status }: { status: "pending" | "rejected" }) {
  const router = useRouter();
  const { refreshSession, logout, user } = useApp();
  const [busy, setBusy] = useState(false);
  const check = async () => { setBusy(true); await refreshSession(); setBusy(false); toast("info", "Status checked", "Your application is still being reviewed."); };
  const doSignOut = () => {
    toast("success", "Signed out", "See you next time.");
    logout();
    router.push("/");
  };
  const pending = status === "pending";
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-md space-y-4 p-6 text-center sm:p-8" role="status">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${pending ? "bg-warn/15 text-warn" : "bg-bad/15 text-bad"}`}>{pending ? <Clock className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}</span>
        <h1 className="font-display text-2xl font-bold">{pending ? "Approval pending" : "Application not approved"}</h1>
        <p className="text-sm text-muted">{pending
          ? `Thank you${user ? `, ${user.name}` : ""}. Your doctor account is waiting for administrator approval. You will get full access to the doctor dashboard as soon as it is approved.`
          : "Your doctor application was not approved, so the doctor dashboard is not available. Please contact the MEDIVANCE administrator."}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {pending && <button className="btn-primary" onClick={check} disabled={busy}><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Check status</button>}
          <button className={`btn-ghost ${pending ? "" : "sm:col-span-2"}`} onClick={doSignOut}><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>
    </div>
  );
}
