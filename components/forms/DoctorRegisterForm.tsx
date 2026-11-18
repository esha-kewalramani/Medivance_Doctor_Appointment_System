"use client";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/hooks/useApp";
import { Errors, isEmail, isPhone, passwordIssue } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";

const blank = { name: "Dr. ", email: "", password: "", confirm: "", phone: "", specialization: "", qualification: "", experience: "", fee: "", languages: "English, Urdu", bio: "" };

/** "Create Account as a Doctor": creates the Supabase login + a PENDING doctor profile. An admin must approve it before the dashboard opens. */
export default function DoctorRegisterForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, registerDoctor } = useApp();
  const [f, setF] = useState(blank);
  const [e, setE] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { confirmEmail: boolean }>(null);
  const set = (k: keyof typeof blank) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  const close = () => { if (busy) return; onClose(); if (done) { setDone(null); setF(blank); } };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    const er: Errors = {};
    if (f.name.trim().length < 5) er.name = "Enter your full name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!isPhone(f.phone)) er.phone = "Enter a valid phone number (10-15 digits).";
    const pw = passwordIssue(f.password); if (pw) er.password = pw;
    if (f.password !== f.confirm) er.confirm = "Passwords do not match.";
    if (!f.specialization) er.specialization = "Select your specialization.";
    if (f.qualification.trim().length < 3) er.qualification = "Qualifications are required (for example MBBS, FCPS).";
    const exp = Number(f.experience), fee = Number(f.fee);
    if (f.experience === "" || !Number.isFinite(exp) || exp < 0 || exp > 60) er.experience = "Experience must be 0-60 years.";
    if (f.fee === "" || !Number.isInteger(fee) || fee < 100 || fee > 1000000) er.fee = "Enter a whole-number fee between Rs 100 and Rs 1,000,000.";
    if (f.bio.trim().length < 20) er.bio = "Tell patients about yourself (at least 20 characters).";
    if (!f.languages.split(",").some((x) => x.trim())) er.languages = "Add at least one language.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    setBusy(true);
    const r = await registerDoctor({ name: f.name, email: f.email, password: f.password, phone: f.phone, specialization: f.specialization, qualification: f.qualification, experience: exp, fee, languages: f.languages, bio: f.bio });
    setBusy(false);
    if (!r.ok) { setE({ email: r.error }); toast("error", "Registration failed", r.error); return; }
    setDone({ confirmEmail: r.confirmEmail });
  };

  const Err = ({ k }: { k: string }) => (e[k] ? <p className="err">{e[k]}</p> : null);

  return (
    <Modal open={open} onClose={close} title={done ? "Application received" : "Create account as a doctor"} wide>
      {done ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
          <p className="text-sm">Thank you, <b>{f.name.trim()}</b>. {done.confirmEmail
            ? "Please open the confirmation e-mail we sent you and confirm your address, then sign in once. Your application is sent to the administrator at that first sign-in."
            : "Your application has been sent to the administrator."}</p>
          <p className="text-sm text-muted">Your account stays <b>pending</b> until an administrator approves it. After approval you can sign in and open your doctor dashboard.</p>
          <button className="btn-primary" onClick={close}>Back to sign in</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="rounded-xl border border-line/50 bg-primary/5 p-3 text-xs text-muted">Your application is reviewed by the MEDIVANCE administrator. You cannot open the doctor dashboard until it is approved.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="dr-name">Full name</label><input id="dr-name" className="input" value={f.name} onChange={set("name")} autoComplete="name" /><Err k="name" /></div>
            <div><label className="label" htmlFor="dr-email">Email address</label><input id="dr-email" type="email" className="input" value={f.email} onChange={set("email")} autoComplete="email" /><Err k="email" /></div>
            <div><label className="label" htmlFor="dr-pw">Password</label>
              <div className="relative"><input id="dr-pw" type={show ? "text" : "password"} className="input pr-10" value={f.password} onChange={set("password")} autoComplete="new-password" placeholder="Min 8 chars, letters + numbers" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted" aria-label="Toggle password visibility">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><Err k="password" /></div>
            <div><label className="label" htmlFor="dr-cf">Confirm password</label><input id="dr-cf" type={show ? "text" : "password"} className="input" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /><Err k="confirm" /></div>
            <div><label className="label" htmlFor="dr-phone">Phone number</label><input id="dr-phone" type="tel" className="input" value={f.phone} onChange={set("phone")} placeholder="+92 3XX XXXXXXX" /><Err k="phone" /></div>
            <div><label className="label" htmlFor="dr-spec">Medical specialization</label><select id="dr-spec" className="input" value={f.specialization} onChange={set("specialization")}><option value="">Select</option>{data.specializations.map((s) => <option key={s.id}>{s.name}</option>)}</select><Err k="specialization" /></div>
            <div><label className="label" htmlFor="dr-q">Qualifications</label><input id="dr-q" className="input" value={f.qualification} onChange={set("qualification")} placeholder="MBBS, FCPS" /><Err k="qualification" /></div>
            <div><label className="label" htmlFor="dr-exp">Professional experience (years)</label><input id="dr-exp" type="number" min={0} max={60} className="input" value={f.experience} onChange={set("experience")} /><Err k="experience" /></div>
            <div><label className="label" htmlFor="dr-fee">Consultation fee (Rs)</label><input id="dr-fee" type="number" min={100} className="input" value={f.fee} onChange={set("fee")} /><Err k="fee" /></div>
            <div><label className="label" htmlFor="dr-lang">Languages (comma separated)</label><input id="dr-lang" className="input" value={f.languages} onChange={set("languages")} /><Err k="languages" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="dr-bio">Professional biography</label><textarea id="dr-bio" rows={3} className="input" value={f.bio} onChange={set("bio")} /><Err k="bio" /></div>
          </div>
          <button className="btn-primary w-full !py-3" disabled={busy}><Send className="h-4 w-4" /> {busy ? "Submitting..." : "Submit application"}</button>
        </form>
      )}
    </Modal>
  );
}
