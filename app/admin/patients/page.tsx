"use client";
import { useMemo, useState } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useApp } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { fmtDate, fmtTime } from "@/lib/utilities";
import { Errors, isEmail, isPhone } from "@/lib/validation";
import { Patient } from "@/types";

const age = (dob: string) => Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000));

function EditForm({ p, onDone }: { p: Patient; onDone: () => void }) {
  const { savePatient } = useApp();
  const [f, setF] = useState<Patient>(p);
  const [e, setE] = useState<Errors>({});
  const set = (k: keyof Patient) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: ev.target.value });
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Errors = {};
    if (f.name.trim().length < 3) er.name = "Enter the full name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid phone number.";
    if (!f.dob || new Date(f.dob) > new Date()) er.dob = "Enter a valid date of birth.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    const r = savePatient({ ...f, email: f.email.trim().toLowerCase() });
    if (!r.ok) { setE({ email: r.error }); return; }
    toast("success", "Patient updated", f.name); onDone();
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div><label className="label" htmlFor="pe-n">Full name</label><input id="pe-n" className="input" value={f.name} onChange={set("name")} />{e.name && <p className="err">{e.name}</p>}</div>
      <div><label className="label" htmlFor="pe-e">Email</label><input id="pe-e" className="input" value={f.email} onChange={set("email")} />{e.email && <p className="err">{e.email}</p>}</div>
      <div><label className="label" htmlFor="pe-p">Phone</label><input id="pe-p" className="input" value={f.phone} onChange={set("phone")} />{e.phone && <p className="err">{e.phone}</p>}</div>
      <div><label className="label" htmlFor="pe-d">Date of birth</label><input id="pe-d" type="date" className="input" value={f.dob} onChange={set("dob")} />{e.dob && <p className="err">{e.dob}</p>}</div>
      <div><label className="label" htmlFor="pe-g">Gender</label><select id="pe-g" className="input" value={f.gender} onChange={set("gender")}><option>Male</option><option>Female</option><option>Other</option></select></div>
      <div><label className="label" htmlFor="pe-b">Blood group</label><select id="pe-b" className="input" value={f.bloodGroup || ""} onChange={set("bloodGroup")}><option value="">Unknown</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}</select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="pe-a">Address</label><input id="pe-a" className="input" value={f.address || ""} onChange={set("address")} /></div>
      <div className="sm:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Save changes</button></div>
    </form>
  );
}

export default function AdminPatientsPage() {
  const { data, doctorById, removePatient } = useApp();
  const [q, setQ] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const rows = useMemo(() => data.patients.filter((p) => `${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(q.toLowerCase())), [data.patients, q]);
  const view = data.patients.find((p) => p.id === viewId);
  const edit = data.patients.find((p) => p.id === editId);
  const history = view ? data.appointments.filter((a) => a.patientId === view.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)) : [];

  const del = async (p: Patient) => {
    const open = data.appointments.filter((a) => a.patientId === p.id && ["pending", "approved"].includes(a.status)).length;
    if (await confirmDialog(`Remove ${p.name}?`, open ? `${open} open appointment(s) will be cancelled.` : "This deletes the patient record.", "Yes, remove", true)) removePatient(p.id);
  };

  return (
    <>
      <PageHeader title="Patient management" subtitle="View registered patients, edit permitted details and review appointment history." />
      <div className="relative mb-4 w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" /></div>      <div className="card table-wrap">
        {rows.length === 0 ? <EmptyState title="No patients found" /> : (
          <table className="table">
            <thead><tr><th>Patient</th><th>Phone</th><th>Age / Gender</th><th>Registered</th><th>Appointments</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{rows.map((p) => (
              <tr key={p.id}>
                <td><div className="flex items-center gap-3"><Avatar name={p.name} size={36} /><div><div className="font-semibold">{p.name}</div><div className="text-xs text-muted">{p.email}</div></div></div></td>
                <td>{p.phone}</td><td>{age(p.dob)} / {p.gender}</td><td>{fmtDate(p.registeredAt.slice(0, 10))}</td><td>{data.appointments.filter((a) => a.patientId === p.id).length}</td>
                <td><div className="flex justify-end gap-1.5">
                  <button className="btn-ghost btn-sm" onClick={() => setViewId(p.id)} aria-label={`View ${p.name}`}><Eye className="h-4 w-4" /></button>
                  <button className="btn-ghost btn-sm" onClick={() => setEditId(p.id)} aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></button>
                  <button className="btn-danger btn-sm" onClick={() => del(p)} aria-label={`Remove ${p.name}`}><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>))}</tbody>
          </table>)}
      </div>

      <Modal open={!!view} onClose={() => setViewId(null)} title="Patient details" wide>
        {view && <div className="space-y-5">
          <div className="flex items-center gap-4"><Avatar name={view.name} size={56} /><div><div className="text-lg font-bold">{view.name}</div><div className="text-sm text-muted">{view.email} &middot; {view.phone}</div></div></div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[["Age", `${age(view.dob)} yrs`], ["Gender", view.gender], ["Blood group", view.bloodGroup || "Unknown"], ["Registered", fmtDate(view.registeredAt.slice(0, 10))]].map(([k, v]) => <div key={k}><dt className="text-xs uppercase text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            <div className="col-span-2 sm:col-span-4"><dt className="text-xs uppercase text-muted">Address</dt><dd className="font-semibold">{view.address || "Not provided"}</dd></div>
          </dl>
          <div><h3 className="mb-2 font-bold">Appointment history ({history.length})</h3>
            {history.length === 0 ? <p className="text-sm text-muted">No appointments yet.</p> : (
              <div className="table-wrap max-h-64 overflow-y-auto rounded-xl border border-line/40"><table className="table"><thead><tr><th>Ref</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>{history.map((a) => <tr key={a.id}><td>{a.ref}</td><td>{doctorById(a.doctorId)?.name ?? "Removed"}</td><td>{fmtDate(a.date)} {fmtTime(a.time)}</td><td><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div>)}
          </div>
        </div>}
      </Modal>
      <Modal open={!!edit} onClose={() => setEditId(null)} title="Edit patient">{edit && <EditForm key={edit.id} p={edit} onDone={() => setEditId(null)} />}</Modal>
    </>
  );
}
