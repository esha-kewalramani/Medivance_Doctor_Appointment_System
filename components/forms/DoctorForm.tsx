"use client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useState } from "react";
import { Save, Upload } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { Doctor, Specialization } from "@/types";
import { Errors, isEmail, isPhone } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";

export default function DoctorForm({ initial, specializations, onSubmit, submitLabel = "Save changes", admin = false, lockEmail = false }: {
  initial: Doctor; specializations: Specialization[]; onSubmit: (d: Doctor) => { ok: boolean; error?: string }; submitLabel?: string; admin?: boolean; lockEmail?: boolean;
}) {
  const [f, setF] = useState({ ...initial, languagesText: initial.languages.join(", "), expText: String(initial.experience), feeText: String(initial.fee) });
  const [e, setE] = useState<Errors>({});
  const set = (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  const photo = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("error", "Please choose an image file"); return; }
    if (file.size > 400 * 1024) { toast("error", "Image too large", "Choose an image under 400 KB (LocalStorage limit)."); return; }
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, photo: String(r.result) }));
    r.readAsDataURL(file);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Errors = {};
    if (f.name.trim().length < 5) er.name = "Enter the doctor's full name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid phone number.";
    if (f.qualification.trim().length < 3) er.qualification = "Qualification is required.";
    if (!f.specialization) er.specialization = "Select a specialization.";
    const exp = Number(f.expText), fee = Number(f.feeText);
    if (!Number.isFinite(exp) || exp < 0 || exp > 60) er.expText = "Experience must be 0-60 years.";
    if (!Number.isFinite(fee) || fee < 100) er.feeText = "Enter a fee of at least Rs 100.";
    if (f.bio.trim().length < 20) er.bio = "Biography must be at least 20 characters.";
    const langs = f.languagesText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!langs.length) er.languagesText = "Add at least one language.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    const { languagesText, expText, feeText, ...rest } = f; void languagesText; void expText; void feeText;
    const r = onSubmit({ ...rest, name: f.name.trim(), email: f.email.trim(), experience: exp, fee, languages: langs });
    if (!r.ok) { setE({ email: r.error || "Could not save." }); toast("error", r.error || "Could not save"); }
  };

  const Err = ({ k }: { k: string }) => (e[k] ? <p className="err">{e[k]}</p> : null);
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={f.name || "Doctor"} photo={f.photo} size={72} />
        <div className="space-y-2">
          <label className="btn-ghost btn-sm cursor-pointer"><Upload className="h-4 w-4" /> Upload photo<input type="file" accept="image/*" className="sr-only" onChange={photo} /></label>
          {f.photo && <button type="button" className="btn-ghost btn-sm ml-2" onClick={() => setF({ ...f, photo: undefined })}>Remove</button>}
          <p className="text-[11px] text-muted">PNG/JPG under 400 KB. Without a photo, initials are shown.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="df-name">Full name</label><input id="df-name" className="input" value={f.name} onChange={set("name")} /><Err k="name" /></div>
        <div><label className="label" htmlFor="df-q">Qualification</label><input id="df-q" className="input" value={f.qualification} onChange={set("qualification")} placeholder="MBBS, FCPS" /><Err k="qualification" /></div>
        <div><label className="label" htmlFor="df-s">Specialization</label><select id="df-s" className="input" value={f.specialization} onChange={set("specialization")}><option value="">Select</option>{specializations.map((s) => <option key={s.id}>{s.name}</option>)}</select><Err k="specialization" /></div>
        <div><label className="label" htmlFor="df-exp">Experience (years)</label><input id="df-exp" type="number" min={0} className="input" value={f.expText} onChange={set("expText")} /><Err k="expText" /></div>
        <div><label className="label" htmlFor="df-fee">Consultation fee (Rs)</label><input id="df-fee" type="number" min={0} className="input" value={f.feeText} onChange={set("feeText")} /><Err k="feeText" /></div>
        <div><label className="label" htmlFor="df-l">Languages (comma separated)</label><input id="df-l" className="input" value={f.languagesText} onChange={set("languagesText")} /><Err k="languagesText" /></div>
        <div><label className="label" htmlFor="df-e">Email</label><input id="df-e" type="email" className="input" value={f.email} onChange={set("email")} readOnly={lockEmail} aria-readonly={lockEmail} />{lockEmail && <p className="text-[11px] text-muted">This is the login email. Change it with &quot;Change email address&quot; (verification required).</p>}<Err k="email" /></div>
        <div><label className="label" htmlFor="df-p">Phone</label><input id="df-p" className="input" value={f.phone} onChange={set("phone")} /><Err k="phone" /></div>
        {admin && !isSupabaseConfigured && <div><label className="label" htmlFor="df-pw">Login password (demo)</label><input id="df-pw" className="input" value={f.password} onChange={set("password")} /></div>}
                <div className="sm:col-span-2"><label className="label" htmlFor="df-b">Professional biography</label><textarea id="df-b" rows={4} className="input" value={f.bio} onChange={set("bio")} /><Err k="bio" /></div>
      </div>
      <button className="btn-primary"><Save className="h-4 w-4" /> {submitLabel}</button>
    </form>
  );
}
