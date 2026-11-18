"use client";
import { useState } from "react";
import { Moon, RefreshCw, Sun } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toggle from "@/components/ui/Toggle";
import { useApp } from "@/hooks/useApp";
import { confirmDialog, toast } from "@/components/notifications/alerts";
import { Errors, isEmail, isPhone, passwordIssue } from "@/lib/validation";
import ChangeEmailCard from "@/components/forms/ChangeEmailCard";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const { data, theme, toggleTheme, updateSettings, resetData, changePassword } = useApp();
  const s = data.settings;
  const [profile, setProfile] = useState({ adminName: s.adminName, adminEmail: s.adminEmail, adminPhone: s.adminPhone });
  const [site, setSite] = useState({ siteName: s.siteName, supportEmail: s.supportEmail, supportPhone: s.supportPhone });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pe, setPe] = useState<Errors>({});
  const [e, setE] = useState<Errors>({});

  const saveProfile = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Errors = {};
    if (profile.adminName.trim().length < 3) er.name = "Enter your name.";
    if (!isEmail(profile.adminEmail)) er.email = "Enter a valid email.";
    if (!isPhone(profile.adminPhone)) er.phone = "Enter a valid phone number.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    updateSettings({ ...profile, adminEmail: profile.adminEmail.trim().toLowerCase() }); toast("success", "Profile updated");
  };
  const savePw = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Errors = {};
    const issue = passwordIssue(pw.next); if (issue) er.next = issue;
    if (pw.next !== pw.confirm) er.confirm = "Passwords do not match.";
    setPe(er);
    if (Object.keys(er).length) return;
    const r = await changePassword(pw.current, pw.next);
    if (!r.ok) { setPe({ current: r.error }); return; }
    setPw({ current: "", next: "", confirm: "" }); toast("success", "Password changed");
  };
  const saveSite = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (site.siteName.trim().length < 2 || !isEmail(site.supportEmail) || !isPhone(site.supportPhone)) { toast("error", "Check the website settings", "Name, a valid email and phone are required."); return; }
    updateSettings(site); toast("success", "Website settings saved");
  };
  const reset = async () => { if (await confirmDialog("Restore demo data?", "All appointments, doctors, patients and settings return to the original sample data.", "Yes, restore", true)) resetData(); };

  return (
    <>
      <PageHeader title="Settings" subtitle="Admin profile, website, appearance, notifications and system configuration." />
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4 p-5" noValidate>
          <h2 className="font-bold">Admin profile</h2>
          <div><label className="label" htmlFor="ap-n">Name</label><input id="ap-n" className="input" value={profile.adminName} onChange={(x) => setProfile({ ...profile, adminName: x.target.value })} />{e.name && <p className="err">{e.name}</p>}</div>
          <div><label className="label" htmlFor="ap-e">Email</label><input id="ap-e" className="input" value={profile.adminEmail} onChange={(x) => setProfile({ ...profile, adminEmail: x.target.value })} readOnly={isSupabaseConfigured} aria-readonly={isSupabaseConfigured} />{e.email && <p className="err">{e.email}</p>}</div>
          <div><label className="label" htmlFor="ap-p">Phone</label><input id="ap-p" className="input" value={profile.adminPhone} onChange={(x) => setProfile({ ...profile, adminPhone: x.target.value })} />{e.phone && <p className="err">{e.phone}</p>}</div>
          <button className="btn-primary" type="submit">Save profile</button>
        </form>

        <form onSubmit={savePw} className="card space-y-4 p-5" noValidate>
          <h2 className="font-bold">Change password</h2>
          {(["current", "next", "confirm"] as const).map((k) => (
            <div key={k}><label className="label" htmlFor={`pw-${k}`}>{k === "current" ? "Current password" : k === "next" ? "New password" : "Confirm new password"}</label>
              <input id={`pw-${k}`} type="password" className="input" value={pw[k]} onChange={(x) => setPw({ ...pw, [k]: x.target.value })} autoComplete="off" />{pe[k] && <p className="err">{pe[k]}</p>}</div>))}
          <button className="btn-primary" type="submit">Update password</button>
        </form>

        {isSupabaseConfigured && <ChangeEmailCard currentEmail={s.adminEmail} />}

        <form onSubmit={saveSite} className="card space-y-4 p-5" noValidate>
          <h2 className="font-bold">Website settings</h2>
          <div><label className="label" htmlFor="ws-n">Site name</label><input id="ws-n" className="input" value={site.siteName} onChange={(x) => setSite({ ...site, siteName: x.target.value })} /></div>
          <div><label className="label" htmlFor="ws-e">Support email</label><input id="ws-e" className="input" value={site.supportEmail} onChange={(x) => setSite({ ...site, supportEmail: x.target.value })} /></div>
          <div><label className="label" htmlFor="ws-p">Support phone</label><input id="ws-p" className="input" value={site.supportPhone} onChange={(x) => setSite({ ...site, supportPhone: x.target.value })} /></div>
          <Toggle checked={s.allowRegistration} onChange={(v) => { updateSettings({ allowRegistration: v }); toast("success", v ? "Patient registration enabled" : "Patient registration disabled"); }} label="Allow new patient registration" hint="When off, the register page shows a notice." />
          <button className="btn-primary" type="submit">Save website settings</button>
        </form>

        <div className="space-y-5">
          <div className="card space-y-4 p-5">
            <h2 className="font-bold">Theme preference</h2>
            <p className="text-sm text-muted">The theme applies to the whole website, including all three portals, charts and dialogs.</p>
            <div className="grid grid-cols-2 gap-3">
              {(["dark", "light"] as const).map((t) => (
                <button key={t} onClick={() => theme !== t && toggleTheme()} className={`rounded-2xl border p-4 text-left transition ${theme === t ? "border-primary bg-primary/10" : "border-line/40 hover:bg-primary/5"}`} aria-pressed={theme === t}>
                  {t === "dark" ? <Moon className="mb-2 h-5 w-5 text-primary" /> : <Sun className="mb-2 h-5 w-5 text-primary" />}<div className="font-semibold capitalize">{t} theme</div><div className="text-xs text-muted">{t === "dark" ? "Neon blue healthcare look" : "Soft glass, purple accents"}</div></button>))}
            </div>
          </div>
          <div className="card space-y-4 p-5">
            <h2 className="font-bold">Notifications</h2>
            <Toggle checked={s.emailNotifications} onChange={(v) => updateSettings({ emailNotifications: v })} label="Email notifications" hint="Simulated in this frontend phase." />
            <Toggle checked={s.smsNotifications} onChange={(v) => updateSettings({ smsNotifications: v })} label="SMS notifications" />
            <Toggle checked={s.appointmentReminders} onChange={(v) => updateSettings({ appointmentReminders: v })} label="Appointment reminders" />
          </div>
          <div className="card space-y-4 p-5">
            <h2 className="font-bold">System configuration</h2>
            <div><label className="label" htmlFor="sc-s">Default slot length (new doctors)</label><select id="sc-s" className="input" value={s.slotMinutes} onChange={(x) => { updateSettings({ slotMinutes: Number(x.target.value) }); toast("success", "Default slot length updated"); }}>{[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></div>
            <button className="btn-danger" onClick={reset}><RefreshCw className="h-4 w-4" /> Restore demo data</button>
          </div>
        </div>
      </div>
    </>
  );
}
