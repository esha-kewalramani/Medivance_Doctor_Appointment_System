"use client";
import { useState } from "react";
import { Plus, Save, Upload, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp, windowsConflict } from "@/hooks/useApp";
import { Errors, isEmail, isPhone, passwordIssue } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";
import { fmtTime, toMin, uid } from "@/lib/utilities";
import { AvailabilityWindow, WEEKDAYS, Weekday } from "@/types";

const DEFAULT_HOURS: AvailabilityWindow[] = (["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[]).map((day) => ({ id: uid("w"), day, start: "09:00", end: "13:00" }));

/** Admin "Add New Doctor" (Supabase mode): creates the login + approved profile through the admin-create-doctor Edge Function. */
export default function AdminAddDoctorForm({ onDone }: { onDone: () => void }) {
  const { data, createDoctorAsAdmin } = useApp();
  const [f, setF] = useState({ name: "Dr. ", email: "", password: "", phone: "", specialization: data.specializations[0]?.name ?? "", qualification: "", experience: "", fee: "2000", languages: "English, Urdu", bio: "", slotMinutes: "30" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [hours, setHours] = useState<AvailabilityWindow[]>(DEFAULT_HOURS);
  const [w, setW] = useState({ day: "Mon" as Weekday, start: "09:00", end: "13:00" });
  const [e, setE] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  const pick = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast("error", "Please choose a JPG, PNG or WebP image"); return; }
    if (file.size > 2 * 1024 * 1024) { toast("error", "Image too large", "Choose an image under 2 MB."); return; }
    setPhoto(file); setPreview(URL.createObjectURL(file));
  };
  const addWindow = () => {
    if (toMin(w.start) >= toMin(w.end)) { toast("error", "Invalid hours", "End time must be after start time."); return; }
    if (windowsConflict(hours, w)) { toast("error", "Conflicting hours", `This overlaps an existing window on ${w.day}.`); return; }
    setHours([...hours, { id: uid("w"), ...w }]);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    const er: Errors = {};
    if (f.name.trim().length < 5) er.name = "Enter the doctor's full name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email.";
    const pw = passwordIssue(f.password); if (pw) er.password = pw;
    if (!isPhone(f.phone)) er.phone = "Enter a valid phone number.";
    if (!f.specialization) er.specialization = "Select a specialization.";
    if (f.qualification.trim().length < 3) er.qualification = "Qualification is required.";
    const exp = Number(f.experience), fee = Number(f.fee);
    if (f.experience === "" || !Number.isFinite(exp) || exp < 0 || exp > 60) er.experience = "Experience must be 0-60 years.";
    if (!Number.isInteger(fee) || fee < 100 || fee > 1000000) er.fee = "Fee must be a whole number from Rs 100 to Rs 1,000,000.";
    if (f.bio.trim().length < 20) er.bio = "Biography must be at least 20 characters.";
    const langs = f.languages.split(",").map((s) => s.trim()).filter(Boolean);
    if (!langs.length) er.languages = "Add at least one language.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    setBusy(true);
    const r = await createDoctorAsAdmin({
      name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, phone: f.phone.trim(), specialization: f.specialization, qualification: f.qualification.trim(),
      experience: exp, fee, languages: langs, bio: f.bio.trim(), slotMinutes: Number(f.slotMinutes), availability: hours.map(({ day, start, end }) => ({ day, start, end })),
    }, photo);
    setBusy(false);
    if (!r.ok) { setE({ email: r.error }); toast("error", "Could not add doctor", r.error); return; }
    toast("success", "Doctor added", `${f.name.trim()} is approved and can sign in now.`);
    onDone();
  };

  const Err = ({ k }: { k: string }) => (e[k] ? <p className="err">{e[k]}</p> : null);
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={f.name || "Doctor"} photo={preview} size={72} />
        <div className="space-y-2">
          <label className="btn-ghost btn-sm cursor-pointer"><Upload className="h-4 w-4" /> Upload photograph<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} /></label>
          {photo && <button type="button" className="btn-ghost btn-sm ml-2" onClick={() => { setPhoto(null); setPreview(undefined); }}>Remove</button>}
          <p className="text-[11px] text-muted">JPG, PNG or WebP under 2 MB. Without a photo, initials are shown.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="ad-name">Full name</label><input id="ad-name" className="input" value={f.name} onChange={set("name")} /><Err k="name" /></div>
        <div><label className="label" htmlFor="ad-email">Login email</label><input id="ad-email" type="email" className="input" value={f.email} onChange={set("email")} /><Err k="email" /></div>
        <div><label className="label" htmlFor="ad-pw">Initial password</label><input id="ad-pw" type="text" autoComplete="off" className="input" value={f.password} onChange={set("password")} placeholder="Min 8 chars, letters + numbers" /><Err k="password" /><p className="text-[11px] text-muted">Share it securely. The doctor can change it or use &quot;Forgot password?&quot;.</p></div>
        <div><label className="label" htmlFor="ad-phone">Phone</label><input id="ad-phone" className="input" value={f.phone} onChange={set("phone")} /><Err k="phone" /></div>
        <div><label className="label" htmlFor="ad-spec">Specialization</label><select id="ad-spec" className="input" value={f.specialization} onChange={set("specialization")}><option value="">Select</option>{data.specializations.map((s) => <option key={s.id}>{s.name}</option>)}</select><Err k="specialization" /></div>
        <div><label className="label" htmlFor="ad-q">Qualifications</label><input id="ad-q" className="input" value={f.qualification} onChange={set("qualification")} placeholder="MBBS, FCPS" /><Err k="qualification" /></div>
        <div><label className="label" htmlFor="ad-exp">Experience (years)</label><input id="ad-exp" type="number" min={0} className="input" value={f.experience} onChange={set("experience")} /><Err k="experience" /></div>
        <div><label className="label" htmlFor="ad-fee">Consultation fee (Rs)</label><input id="ad-fee" type="number" min={100} className="input" value={f.fee} onChange={set("fee")} /><Err k="fee" /></div>
        <div><label className="label" htmlFor="ad-lang">Languages (comma separated)</label><input id="ad-lang" className="input" value={f.languages} onChange={set("languages")} /><Err k="languages" /></div>
        <div><label className="label" htmlFor="ad-slot">Appointment length</label><select id="ad-slot" className="input" value={f.slotMinutes} onChange={set("slotMinutes")}>{[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="ad-bio">Professional biography</label><textarea id="ad-bio" rows={3} className="input" value={f.bio} onChange={set("bio")} /><Err k="bio" /></div>
      </div>
      <div>
        <p className="label">Working hours</p>
        <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
          <select aria-label="Day" className="input" value={w.day} onChange={(x) => setW({ ...w, day: x.target.value as Weekday })}>{WEEKDAYS.map((d) => <option key={d}>{d}</option>)}</select>
          <input aria-label="From" type="time" className="input" value={w.start} onChange={(x) => setW({ ...w, start: x.target.value })} />
          <input aria-label="To" type="time" className="input" value={w.end} onChange={(x) => setW({ ...w, end: x.target.value })} />
          <button type="button" className="btn-ghost" onClick={addWindow}><Plus className="h-4 w-4" /> Add window</button>
        </div>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">{[...hours].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || toMin(a.start) - toMin(b.start)).map((h) => (
          <li key={h.id} className="flex items-center justify-between rounded-xl border border-line/40 px-3 py-2 text-sm"><span><b>{h.day}</b> &middot; {fmtTime(h.start)} - {fmtTime(h.end)}</span><button type="button" className="text-bad" aria-label="Remove window" onClick={() => setHours(hours.filter((x) => x.id !== h.id))}><X className="h-4 w-4" /></button></li>))}</ul>
        {hours.length === 0 && <p className="mt-2 text-xs text-muted">No hours yet: the doctor can set them later under Availability.</p>}
      </div>
      <button className="btn-primary" disabled={busy}><Save className="h-4 w-4" /> {busy ? "Creating account..." : "Add doctor (auto-approved)"}</button>
    </form>
  );
}
