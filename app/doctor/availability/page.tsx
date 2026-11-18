"use client";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useApp, windowsConflict } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { addDays, fmtTime, toMin, todayISO, uid, weekdayOf, fmtDate } from "@/lib/utilities";
import { AvailabilityWindow, WEEKDAYS, Weekday } from "@/types";

export default function AvailabilityPage() {
  const { data, session, saveDoctor, getSlots, patientById } = useApp();
  const me = data.doctors.find((d) => d.id === session?.userId);
  const [form, setForm] = useState<{ id?: string; day: Weekday; start: string; end: string }>({ day: "Mon", start: "09:00", end: "12:00" });
  const [edit, setEdit] = useState<AvailabilityWindow | null>(null);
  const [date, setDate] = useState(todayISO());
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i)), []);
  if (!me) return null;

  const validate = (w: { day: Weekday; start: string; end: string }, ignoreId?: string) => {
    if (!w.start || !w.end) return "Select both start and end time.";
    if (toMin(w.end) - toMin(w.start) < me.slotMinutes) return `The range must be at least one ${me.slotMinutes}-minute slot.`;
    if (windowsConflict(me.availability, w, ignoreId)) return `This overlaps an existing ${w.day} consultation window.`;
    return null;
  };
  const persist = (availability: AvailabilityWindow[], msg: string) => { const r = saveDoctor({ ...me, availability }); if (r.ok) toast("success", "Availability updated", msg); };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(form);
    if (err) { toast("error", "Cannot add hours", err); return; }
    persist([...me.availability, { id: uid("w"), day: form.day, start: form.start, end: form.end }], `${form.day} ${fmtTime(form.start)} - ${fmtTime(form.end)} added.`);
  };
  const saveEdit = () => {
    if (!edit) return;
    const err = validate(edit, edit.id);
    if (err) { toast("error", "Cannot save", err); return; }
    persist(me.availability.map((w) => (w.id === edit.id ? edit : w)), "Consultation hours edited.");
    setEdit(null);
  };
  const remove = async (w: AvailabilityWindow) => {
    const active = data.appointments.filter((a) => a.doctorId === me.id && a.date >= todayISO() && ["pending", "approved"].includes(a.status) && weekdayOf(a.date) === w.day && toMin(a.time) >= toMin(w.start) && toMin(a.time) < toMin(w.end)).length;
    const ok = await confirmDialog("Remove these hours?", active ? `${active} upcoming appointment(s) fall inside this window. They will stay booked but no new bookings can be made.` : `${w.day} ${fmtTime(w.start)} - ${fmtTime(w.end)} will no longer be bookable.`, "Yes, remove", true);
    if (ok) persist(me.availability.filter((x) => x.id !== w.id), "Time slots removed.");
  };
  const toggleDay = (d: Weekday) => {
    const has = me.availability.some((w) => w.day === d);
    if (has) { confirmDialog(`Close ${d}?`, `All ${d} consultation windows will be removed.`, "Yes, close day", true).then((ok) => ok && persist(me.availability.filter((w) => w.day !== d), `${d} is now a day off.`)); }
    else persist([...me.availability, { id: uid("w"), day: d, start: "09:00", end: "13:00" }], `${d} opened 9:00 AM - 1:00 PM. Edit the hours below.`);
  };
  const slots = getSlots(me.id, date);

  return (
    <>
      <PageHeader title="Availability" subtitle="Choose your working days, consultation hours and slot length." />
      <div className="card mb-5 p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Working weekdays</h2>
        <div className="flex flex-wrap gap-2">{WEEKDAYS.map((d) => { const on = me.availability.some((w) => w.day === d); return <button key={d} onClick={() => toggleDay(d)} aria-pressed={on} className={`btn btn-sm ${on ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}>{d}</button>; })}</div>
        <div className="mt-4 flex items-center gap-3"><label className="label !mb-0" htmlFor="slotmin">Slot length</label>
          <select id="slotmin" className="input !w-auto" value={me.slotMinutes} onChange={(e) => { const r = saveDoctor({ ...me, slotMinutes: Number(e.target.value) }); if (r.ok) toast("success", "Slot length updated", `Slots are now ${e.target.value} minutes.`); }}>
            {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <form onSubmit={add} className="card space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Add consultation hours</h2>
            <div><label className="label" htmlFor="a-day">Day</label><select id="a-day" className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value as Weekday })}>{WEEKDAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="a-s">From</label><input id="a-s" type="time" className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div><div><label className="label" htmlFor="a-e">To</label><input id="a-e" type="time" className="input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div></div>
            <button className="btn-primary w-full"><Plus className="h-4 w-4" /> Add hours</button>
          </form>
          <div className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Current windows</h2>
            <ul className="space-y-2">{[...me.availability].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || toMin(a.start) - toMin(b.start)).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-line/40 bg-primary/5 px-3 py-2 text-sm"><span><b>{w.day}</b> - {fmtTime(w.start)} to {fmtTime(w.end)}</span>
                <span className="flex gap-1"><button className="btn-ghost btn-sm" onClick={() => setEdit(w)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button><button className="btn-ghost btn-sm text-bad" onClick={() => remove(w)} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button></span></li>))}
              {me.availability.length === 0 && <li className="text-sm text-muted">No consultation hours yet. Patients cannot book you.</li>}</ul>
          </div>
        </div>
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold">Slot overview</h2><p className="mb-3 text-xs text-muted">Booked and open slots for a selected date.</p>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">{days.map((d) => <button key={d} onClick={() => setDate(d)} className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs ${date === d ? "border-primary bg-primary text-primary-fg" : "border-line/60 hover:border-primary"}`}><span className="block font-semibold">{weekdayOf(d)}</span>{d.slice(8)}/{d.slice(5, 7)}</button>)}</div>
          <p className="mb-2 text-sm font-semibold">{fmtDate(date)} ({weekdayOf(date)})</p>
          {slots.length === 0 ? <p className="text-sm text-muted">No consultation hours on this day.</p> : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map((s) => {
              const ap = data.appointments.find((a) => a.doctorId === me.id && a.date === date && a.time === s.time && ["pending", "approved", "completed"].includes(a.status));
              return <div key={s.time} className={`rounded-xl border px-3 py-2 text-xs ${s.state === "booked" ? "border-warn/40 bg-warn/10" : s.state === "past" ? "border-line/30 opacity-50" : "border-ok/40 bg-ok/10"}`}><p className="font-semibold">{fmtTime(s.time)}</p><p className="truncate text-muted">{s.state === "booked" ? `Booked - ${patientById(ap?.patientId ?? "")?.name ?? "patient"}` : s.state === "past" ? "Passed" : "Open"}</p></div>;
            })}</div>)}
        </div>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit consultation hours">
        {edit && <div className="space-y-3">
          <div><label className="label" htmlFor="e-day">Day</label><select id="e-day" className="input" value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value as Weekday })}>{WEEKDAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="e-s">From</label><input id="e-s" type="time" className="input" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></div><div><label className="label" htmlFor="e-e">To</label><input id="e-e" type="time" className="input" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></div></div>
          <button className="btn-primary w-full" onClick={saveEdit}>Save changes</button></div>}
      </Modal>
    </>
  );
}
