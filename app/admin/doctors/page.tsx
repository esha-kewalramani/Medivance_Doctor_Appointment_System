"use client";
import { useMemo, useState } from "react";
import { Clock, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import DoctorForm from "@/components/forms/DoctorForm";
import AdminAddDoctorForm from "@/components/forms/AdminAddDoctorForm";
import DoctorApplications from "@/components/admin/DoctorApplications";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp, windowsConflict } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { fmtTime, money, toMin, uid } from "@/lib/utilities";
import { Doctor, WEEKDAYS, Weekday } from "@/types";

const blank = (spec: string): Doctor => ({
  id: uid("d"), name: "Dr. ", email: "", phone: "", password: "Doctor@123", specialization: spec, qualification: "", experience: 1, rating: 0,
  fee: 2000, languages: ["English", "Urdu"], bio: "", slotMinutes: 30, availability: [], reviews: [],
});

function Availability({ doc }: { doc: Doctor }) {
  const { saveDoctor } = useApp();
  const [day, setDay] = useState<Weekday>("Mon");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");
  const add = () => {
    if (toMin(start) >= toMin(end)) { toast("error", "Invalid hours", "End time must be after start time."); return; }
    const w = { id: uid("w"), day, start, end };
    if (windowsConflict(doc.availability, w)) { toast("error", "Conflicting hours", `This overlaps an existing window on ${day}.`); return; }
    const r = saveDoctor({ ...doc, availability: [...doc.availability, w] });
    if (r.ok) toast("success", "Availability updated", `${day} ${fmtTime(start)} - ${fmtTime(end)}`);
  };
  const del = async (id: string) => {
    if (!(await confirmDialog("Remove this window?", "Existing bookings are kept, but no new slots will be offered.", "Yes, remove", true))) return;
    saveDoctor({ ...doc, availability: doc.availability.filter((w) => w.id !== id) });
    toast("success", "Window removed");
  };
  const list = [...doc.availability].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || toMin(a.start) - toMin(b.start));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
        <div><label className="label" htmlFor="av-d">Day</label><select id="av-d" className="input" value={day} onChange={(e) => setDay(e.target.value as Weekday)}>{WEEKDAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div><label className="label" htmlFor="av-s">From</label><input id="av-s" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><label className="label" htmlFor="av-e">To</label><input id="av-e" type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <button className="btn-primary" onClick={add}><Plus className="h-4 w-4" /> Add window</button>
      </div>
      <p className="text-xs text-muted">Windows are split into {doc.slotMinutes}-minute slots for patients.</p>
      {list.length === 0 ? <p className="text-sm text-muted">No consultation hours yet.</p> : (
        <ul className="grid gap-2 sm:grid-cols-2">{list.map((w) => (
          <li key={w.id} className="flex items-center justify-between rounded-xl border border-line/40 px-3 py-2 text-sm"><span><b>{w.day}</b> &middot; {fmtTime(w.start)} - {fmtTime(w.end)}</span>
            <button className="text-bad" aria-label="Remove window" onClick={() => del(w.id)}><X className="h-4 w-4" /></button></li>))}</ul>)}
    </div>
  );
}

export default function AdminDoctorsPage() {
  const { data, saveDoctor, removeDoctor } = useApp();
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("all");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [availId, setAvailId] = useState<string | null>(null);

  const rows = useMemo(() => data.doctors.filter((d) => (spec === "all" || d.specialization === spec) && `${d.name} ${d.email} ${d.qualification}`.toLowerCase().includes(q.toLowerCase())), [data.doctors, q, spec]);
  const editing = data.doctors.find((d) => d.id === editId);
  const avail = data.doctors.find((d) => d.id === availId);

  const del = async (d: Doctor) => {
    const open = data.appointments.filter((a) => a.doctorId === d.id && ["pending", "approved"].includes(a.status)).length;
    if (await confirmDialog(`Delete ${d.name}?`, open ? `${open} open appointment(s) will be cancelled and patients notified.` : "This removes the doctor from the directory.", "Yes, delete", true)) removeDoctor(d.id);
  };

  return (
    <>
      <DoctorApplications />
      <PageHeader title="Doctor management" subtitle="Add, edit, remove doctors and manage their consultation hours." actions={<button className="btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add New Doctor</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1 sm:flex-none sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search name, email, qualification" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search doctors" /></div>
        <select className="input min-w-0 flex-1 sm:flex-none sm:w-56" value={spec} onChange={(e) => setSpec(e.target.value)} aria-label="Filter by specialization"><option value="all">All specializations</option>{data.specializations.map((s) => <option key={s.id}>{s.name}</option>)}</select>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? <EmptyState title="No doctors found" text="Try a different search or filter." /> : (
          <table className="table">
            <thead><tr><th>Doctor</th><th>Specialization</th><th>Experience</th><th>Fee</th><th>Rating</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{rows.map((d) => (
              <tr key={d.id}>
                <td><div className="flex items-center gap-3"><Avatar name={d.name} photo={d.photo} size={38} /><div><div className="font-semibold">{d.name}</div><div className="text-xs text-muted">{d.email}</div></div></div></td>
                <td>{d.specialization}</td><td>{d.experience} yrs</td><td>{money(d.fee)}</td><td>{d.reviews.length ? d.rating.toFixed(1) : "New"}</td>
                <td><div className="flex justify-end gap-1.5">
                  <button className="btn-ghost btn-sm" onClick={() => setAvailId(d.id)} aria-label={`Availability of ${d.name}`}><Clock className="h-4 w-4" /></button>
                  <button className="btn-ghost btn-sm" onClick={() => setEditId(d.id)} aria-label={`Edit ${d.name}`}><Pencil className="h-4 w-4" /></button>
                  <button className="btn-danger btn-sm" onClick={() => del(d)} aria-label={`Delete ${d.name}`}><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>))}</tbody>
          </table>)}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add new doctor" wide>
        {adding && isSupabaseConfigured && <AdminAddDoctorForm onDone={() => setAdding(false)} />}
        {adding && !isSupabaseConfigured && <DoctorForm admin initial={blank(data.specializations[0]?.name ?? "General Medicine")} specializations={data.specializations} submitLabel="Add doctor"
          onSubmit={(d) => { const r = saveDoctor(d, true); if (r.ok) { setAdding(false); toast("success", "Doctor added", d.name); } return r; }} />}
      </Modal>
      <Modal open={!!editing} onClose={() => setEditId(null)} title="Edit doctor" wide>
        {editing && <DoctorForm key={editing.id} admin lockEmail={isSupabaseConfigured} initial={editing} specializations={data.specializations}
          onSubmit={(d) => { const r = saveDoctor(d); if (r.ok) { setEditId(null); toast("success", "Doctor updated", d.name); } return r; }} />}
      </Modal>
      <Modal open={!!avail} onClose={() => setAvailId(null)} title={avail ? `Availability - ${avail.name}` : "Availability"} wide>{avail && <Availability doc={avail} />}</Modal>
    </>
  );
}
