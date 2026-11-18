"use client";
import { useEffect, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useApp } from "@/hooks/useApp";
import { Errors, passwordIssue, validatePatient } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";
import ChangeEmailCard from "@/components/forms/ChangeEmailCard";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fmtDate, fmtTime } from "@/lib/utilities";
import { Patient } from "@/types";

export default function PatientProfilePage() {
  const { data, session, savePatient, doctorById, notify, changePassword } = useApp();
  const me = data.patients.find((p) => p.id === session?.userId);
  const [f, setF] = useState<Patient | null>(null);
  const [e, setE] = useState<Errors>({});
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pe, setPe] = useState<Errors>({});
  useEffect(() => { if (me && !f) setF(me); }, [me, f]);
  if (!me || !f) return null;
  const set = (k: keyof Patient) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: ev.target.value });

  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er = validatePatient({ ...f }, false);
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    const r = savePatient({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() });
    if (!r.ok) { setE({ email: r.error }); toast("error", r.error); return; }
    toast("success", "Profile updated", "Your details were saved.");
  };
  const changePw = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Errors = {};
    const issue = passwordIssue(pw.next); if (issue) er.next = issue;
    if (pw.next !== pw.confirm) er.confirm = "Passwords do not match.";
    setPe(er);
    if (Object.keys(er).length) return;
    const r = await changePassword(pw.current, pw.next);
    if (!r.ok) { setPe({ current: r.error }); return; }
    notify({ role: "patient", userId: me.id, title: "Password changed", body: "Your password was updated." });
    setPw({ current: "", next: "", confirm: "" });
    toast("success", "Password changed");
  };
  const history = data.appointments.filter((a) => a.patientId === me.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <>
      <PageHeader title="My Profile" subtitle="View and update your personal details." />
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={save} noValidate className="card space-y-4 p-5 lg:col-span-2">
          <div className="flex items-center gap-4"><Avatar name={f.name || me.name} size={64} /><div><p className="font-display text-lg font-bold">{me.name}</p><p className="text-xs text-muted">Member since {fmtDate(me.registeredAt.slice(0, 10))}</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="pn">Full name</label><input id="pn" className="input" value={f.name} onChange={set("name")} />{e.name && <p className="err">{e.name}</p>}</div>
            <div><label className="label" htmlFor="pe">Email</label><input id="pe" type="email" className="input" value={f.email} onChange={set("email")} readOnly={isSupabaseConfigured} aria-readonly={isSupabaseConfigured} />{isSupabaseConfigured && <p className="text-[11px] text-muted">Login email: change it with the card on the right.</p>}{e.email && <p className="err">{e.email}</p>}</div>
            <div><label className="label" htmlFor="pp">Phone</label><input id="pp" className="input" value={f.phone} onChange={set("phone")} />{e.phone && <p className="err">{e.phone}</p>}</div>
            <div><label className="label" htmlFor="pd">Date of birth</label><input id="pd" type="date" className="input" value={f.dob} onChange={set("dob")} />{e.dob && <p className="err">{e.dob}</p>}</div>
            <div><label className="label" htmlFor="pg">Gender</label><select id="pg" className="input" value={f.gender} onChange={set("gender")}><option>Female</option><option>Male</option><option>Other</option></select></div>
            <div><label className="label" htmlFor="pb">Blood group</label><select id="pb" className="input" value={f.bloodGroup || ""} onChange={set("bloodGroup")}><option value="">Unknown</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="pa">Address</label><input id="pa" className="input" value={f.address || ""} onChange={set("address")} /></div>
          </div>
          <button className="btn-primary"><Save className="h-4 w-4" /> Save changes</button>
        </form>
        <div className="space-y-5"><form onSubmit={changePw} noValidate className="card h-fit space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-5 w-5 text-primary" /> Change password</h2>
          {([["current", "Current password"], ["next", "New password"], ["confirm", "Confirm new password"]] as const).map(([k, l]) => (
            <div key={k}><label className="label" htmlFor={`pw-${k}`}>{l}</label><input id={`pw-${k}`} type="password" className="input" value={pw[k]} onChange={(x) => setPw({ ...pw, [k]: x.target.value })} />{pe[k] && <p className="err">{pe[k]}</p>}</div>
          ))}
          <button className="btn-primary w-full">Update password</button>
          {!isSupabaseConfigured && <p className="text-[11px] text-muted">Frontend demonstration. Real password handling arrives with Supabase Auth.</p>}
        </form>
        <ChangeEmailCard currentEmail={me.email} /></div>
      </div>
      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Appointment history</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>Reference</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{history.map((a) => <tr key={a.id}><td className="font-semibold">{a.ref}</td><td>{doctorById(a.doctorId)?.name ?? "Removed doctor"}</td><td>{fmtDate(a.date)}</td><td>{fmtTime(a.time)}</td><td><StatusBadge status={a.status} /></td></tr>)}
            {history.length === 0 && <tr><td colSpan={5} className="text-center text-muted">No appointments yet.</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}
