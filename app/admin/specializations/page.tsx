"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import SpecIcon from "@/components/ui/SpecIcon";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { uid } from "@/lib/utilities";
import { Specialization } from "@/types";

const ICONS = ["HeartPulse", "Sparkles", "Brain", "Baby", "Bone", "Smile", "Stethoscope", "Flower2"];

export default function AdminSpecializationsPage() {
  const { data, saveSpecialization, removeSpecialization } = useApp();
  const [form, setForm] = useState<{ s: Specialization; old?: string } | null>(null);
  const [err, setErr] = useState("");
  const [listId, setListId] = useState<string | null>(null);
  const listing = data.specializations.find((s) => s.id === listId);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    if (form.s.name.trim().length < 3) { setErr("Name must be at least 3 characters."); return; }
    if (form.s.description.trim().length < 10) { setErr("Add a short description (10+ characters)."); return; }
    const r = saveSpecialization({ ...form.s, name: form.s.name.trim(), description: form.s.description.trim() }, form.old);
    if (!r.ok) { setErr(r.error); return; }
    toast("success", form.old ? "Specialization updated" : "Specialization added", form.s.name); setForm(null); setErr("");
  };
  const del = async (s: Specialization) => {
    if (!(await confirmDialog(`Delete ${s.name}?`, "This cannot be undone.", "Yes, delete", true))) return;
    const r = removeSpecialization(s.id);
    if (!r.ok) toast("error", "Cannot delete", r.error); else toast("success", "Specialization deleted");
  };

  return (
    <>
      <PageHeader title="Specializations" subtitle="Manage the medical specialties offered on the platform." actions={<button className="btn-primary" onClick={() => { setErr(""); setForm({ s: { id: uid("s"), name: "", description: "", icon: "Stethoscope" } }); }}><Plus className="h-4 w-4" /> Add specialization</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.specializations.map((s) => {
          const n = data.doctors.filter((d) => d.specialization === s.name).length;
          return (
            <div key={s.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><SpecIcon name={s.icon} className="h-5 w-5" /></span><div><div className="font-bold">{s.name}</div><div className="text-xs text-muted">{n} doctor{n === 1 ? "" : "s"}</div></div></div>
              <p className="flex-1 text-sm text-muted">{s.description}</p>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm" onClick={() => setListId(s.id)}><Users className="h-4 w-4" /> Doctors</button>
                <button className="btn-ghost btn-sm" onClick={() => { setErr(""); setForm({ s, old: s.name }); }}><Pencil className="h-4 w-4" /> Edit</button>
                <button className="btn-danger btn-sm ml-auto" onClick={() => del(s)} aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>);
        })}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.old ? "Edit specialization" : "Add specialization"}>
        {form && <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className="label" htmlFor="sp-n">Name</label><input id="sp-n" className="input" value={form.s.name} onChange={(e) => setForm({ ...form, s: { ...form.s, name: e.target.value } })} /></div>
          <div><label className="label" htmlFor="sp-d">Description</label><textarea id="sp-d" rows={3} className="input" value={form.s.description} onChange={(e) => setForm({ ...form, s: { ...form.s, description: e.target.value } })} /></div>
          <div><span className="label">Icon</span><div className="flex flex-wrap gap-2">{ICONS.map((i) => (
            <button type="button" key={i} aria-label={i} onClick={() => setForm({ ...form, s: { ...form.s, icon: i } })} className={`grid h-11 w-11 place-items-center rounded-xl border ${form.s.icon === i ? "border-primary bg-primary/20 text-primary" : "border-line/40"}`}><SpecIcon name={i} className="h-5 w-5" /></button>))}</div></div>
          {err && <p className="err">{err}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" type="submit">Save</button></div>
        </form>}
      </Modal>
      <Modal open={!!listing} onClose={() => setListId(null)} title={listing ? `${listing.name} doctors` : "Doctors"}>
        {listing && (() => { const l = data.doctors.filter((d) => d.specialization === listing.name); return l.length === 0 ? <p className="text-sm text-muted">No doctors in this specialization yet.</p> : (
          <ul className="space-y-3">{l.map((d) => <li key={d.id} className="flex items-center gap-3"><Avatar name={d.name} photo={d.photo} size={40} /><div><div className="font-semibold">{d.name}</div><div className="text-xs text-muted">{d.qualification} &middot; {d.experience} yrs</div></div></li>)}</ul>); })()}
      </Modal>
    </>
  );
}
