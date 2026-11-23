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

      {/* Weekdays & Slot Settings */}
      <div className="card mb-5 p-4 sm:p-6">
        <h2 className="mb-3 font-display text-base sm:text-lg font-semibold">Working Weekdays</h2>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {WEEKDAYS.map((d) => {
            const on = me.availability.some((w) => w.day === d);
            return (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                className={`btn btn-sm px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
                  on ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-t border-line/40 pt-3.5">
          <label className="label !mb-0 text-xs sm:text-sm" htmlFor="slotmin">
            Consultation Slot Length:
          </label>
          <select
            id="slotmin"
            className="input !w-full sm:!w-auto text-xs sm:text-sm font-medium"
            value={me.slotMinutes}
            onChange={(e) => {
              const r = saveDoctor({ ...me, slotMinutes: Number(e.target.value) });
              if (r.ok) toast("success", "Slot length updated", `Slots are now ${e.target.value} minutes.`);
            }}
          >
            {[15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Management & Slot Overview */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
        {/* Left Column: Form & Current Windows */}
        <div className="space-y-4 sm:space-y-5 lg:col-span-5 xl:col-span-5">
          <form onSubmit={add} className="card space-y-3 p-4 sm:p-5">
            <h2 className="font-display text-base sm:text-lg font-semibold">Add Consultation Hours</h2>
            <div>
              <label className="label text-xs sm:text-sm" htmlFor="a-day">
                Day of Week
              </label>
              <select
                id="a-day"
                className="input text-xs sm:text-sm"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value as Weekday })}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="a-s">
                  From (Start)
                </label>
                <input
                  id="a-s"
                  type="time"
                  className="input text-xs sm:text-sm"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="a-e">
                  To (End)
                </label>
                <input
                  id="a-e"
                  type="time"
                  className="input text-xs sm:text-sm"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary w-full text-xs sm:text-sm">
              <Plus className="h-4 w-4" /> Add Hours
            </button>
          </form>

          <div className="card p-4 sm:p-5">
            <h2 className="mb-3 font-display text-base sm:text-lg font-semibold">Current Windows</h2>
            <ul className="space-y-2">
              {[...me.availability]
                .sort(
                  (a, b) =>
                    WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || toMin(a.start) - toMin(b.start)
                )
                .map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line/40 bg-primary/5 p-2.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <b className="font-semibold text-primary">{w.day}</b>{" "}
                      <span className="text-muted mx-1">•</span> {fmtTime(w.start)} – {fmtTime(w.end)}
                    </span>
                    <span className="flex gap-1 shrink-0">
                      <button
                        className="btn-ghost btn-sm h-8 w-8 p-0 grid place-items-center rounded-lg"
                        onClick={() => setEdit(w)}
                        aria-label="Edit"
                        title="Edit window"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn-ghost btn-sm h-8 w-8 p-0 grid place-items-center rounded-lg text-bad hover:bg-bad/10"
                        onClick={() => remove(w)}
                        aria-label="Remove"
                        title="Remove window"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              {me.availability.length === 0 && (
                <li className="text-xs sm:text-sm text-muted p-3 text-center rounded-xl bg-surface-2/40">
                  No consultation hours configured yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Slot Overview */}
        <div className="card p-4 sm:p-5 lg:col-span-7 xl:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold">Slot Overview</h2>
              <p className="text-xs text-muted">Real-time breakdown of booked and open slots for the selected date.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted shrink-0 pt-1 sm:pt-0">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" /> Open</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn" /> Booked</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted/60" /> Passed</span>
            </div>
          </div>

          {/* Date Picker Horizontal Carousel */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1 sm:mx-0">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs transition min-w-[62px] sm:min-w-[68px] ${
                  date === d
                    ? "border-primary bg-primary text-primary-fg shadow-glow font-bold"
                    : "border-line/60 hover:border-primary hover:bg-surface-2/60"
                }`}
              >
                <span className="block font-semibold text-[11px] sm:text-xs uppercase tracking-wider">{weekdayOf(d)}</span>
                <span className="text-xs">{d.slice(8)}/{d.slice(5, 7)}</span>
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between border-b border-line/40 pb-2">
            <p className="text-xs sm:text-sm font-semibold">
              {fmtDate(date)} <span className="text-muted font-normal">({weekdayOf(date)})</span>
            </p>
            <span className="text-xs text-muted">
              {slots.filter((s) => s.state === "free").length} slots free
            </span>
          </div>

          {slots.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface-2/30 border border-line/40">
              <p className="text-sm text-muted">No consultation hours configured on {weekdayOf(date)}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-2.5">
              {slots.map((s) => {
                const ap = data.appointments.find(
                  (a) =>
                    a.doctorId === me.id &&
                    a.date === date &&
                    a.time === s.time &&
                    ["pending", "approved", "completed"].includes(a.status)
                );
                const patientName = ap?.guestDetails?.name || patientById(ap?.patientId ?? "")?.name || "Patient";
                return (
                  <div
                    key={s.time}
                    className={`rounded-xl border p-2.5 text-xs transition flex flex-col justify-between ${
                      s.state === "booked"
                        ? "border-warn/40 bg-warn/10 text-warn-fg"
                        : s.state === "past"
                        ? "border-line/30 opacity-60 bg-surface-2/20"
                        : "border-ok/40 bg-ok/10 text-ok-fg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs sm:text-sm">{fmtTime(s.time)}</p>
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          s.state === "booked" ? "bg-warn" : s.state === "past" ? "bg-muted" : "bg-ok"
                        }`}
                      />
                    </div>
                    <p className="truncate text-muted text-[11px] mt-1" title={s.state === "booked" ? `Booked: ${patientName}` : undefined}>
                      {s.state === "booked" ? `Booked • ${patientName}` : s.state === "past" ? "Passed" : "Open Slot"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Edit Window */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Consultation Hours">
        {edit && (
          <div className="space-y-3.5">
            <div>
              <label className="label text-xs sm:text-sm" htmlFor="e-day">
                Day of Week
              </label>
              <select
                id="e-day"
                className="input text-xs sm:text-sm"
                value={edit.day}
                onChange={(e) => setEdit({ ...edit, day: e.target.value as Weekday })}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="e-s">
                  From (Start)
                </label>
                <input
                  id="e-s"
                  type="time"
                  className="input text-xs sm:text-sm"
                  value={edit.start}
                  onChange={(e) => setEdit({ ...edit, start: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="e-e">
                  To (End)
                </label>
                <input
                  id="e-e"
                  type="time"
                  className="input text-xs sm:text-sm"
                  value={edit.end}
                  onChange={(e) => setEdit({ ...edit, end: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary w-full text-xs sm:text-sm mt-2" onClick={saveEdit}>
              Save Changes
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
