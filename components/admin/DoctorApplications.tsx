"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { money } from "@/lib/utilities";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/** Admin review of doctor self-registrations. The decision is enforced by the database (admin_review_doctor). */
export default function DoctorApplications() {
  const { data, reviewApplication } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  if (!isSupabaseConfigured) return null;
  const pending = data.applications.filter((d) => d.approval === "pending");
  const rejected = data.applications.filter((d) => d.approval === "rejected");
  if (!pending.length && !rejected.length) return null;

  const act = async (id: string, name: string, decision: "approved" | "rejected") => {
    if (busy) return;
    const ok = await confirmDialog(`${decision === "approved" ? "Approve" : "Reject"} ${name}?`, decision === "approved" ? "The doctor can sign in and open the dashboard, and appears in the public directory once hours are set." : "The doctor will not be able to open the dashboard.", decision === "approved" ? "Yes, approve" : "Yes, reject", decision === "rejected");
    if (!ok) return;
    setBusy(id);
    const r = await reviewApplication(id, decision);
    setBusy(null);
    if (!r.ok) toast("error", "Action failed", r.error); else toast("success", decision === "approved" ? "Doctor approved" : "Application rejected", name);
  };

  const Row = ({ d }: { d: (typeof pending)[number] }) => (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line/40 p-3">
      <Avatar name={d.name} photo={d.photo} size={40} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{d.name} <span className="font-normal text-muted">- {d.specialization || "no specialization"}</span></p>
        <p className="text-xs text-muted">{d.email} - {d.phone} - {d.qualification} - {d.experience} yrs - {money(d.fee)}</p>
        {d.bio && <p className="mt-1 line-clamp-2 text-xs text-muted">{d.bio}</p>}
      </div>
      <div className="flex gap-1.5">
        <button className="btn-primary btn-sm" disabled={busy === d.id} onClick={() => act(d.id, d.name, "approved")}><Check className="h-4 w-4" /> Approve</button>
        {d.approval === "pending" && <button className="btn-danger btn-sm" disabled={busy === d.id} onClick={() => act(d.id, d.name, "rejected")}><X className="h-4 w-4" /> Reject</button>}
      </div>
    </li>
  );

  return (
    <section className="card mb-5 p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">Doctor applications <span className="badge badge-pending ml-1">{pending.length} pending</span></h2>
      <ul className="space-y-2">{pending.map((d) => <Row key={d.id} d={d} />)}</ul>
      {rejected.length > 0 && <><h3 className="mb-2 mt-4 text-sm font-semibold text-muted">Rejected ({rejected.length}) - can be approved later</h3><ul className="space-y-2">{rejected.map((d) => <Row key={d.id} d={d} />)}</ul></>}
    </section>
  );
}
