// Supabase Edge Function: admin-create-doctor
// Creates a doctor login (Supabase Auth) + doctor profile + availability, already APPROVED. Only a signed-in ADMIN may call it.
// The service-role key exists ONLY here (Supabase injects SUPABASE_SERVICE_ROLE_KEY into Edge Functions); it never reaches the browser.
//
// Deploy:  supabase functions deploy admin-create-doctor      (or paste into Dashboard -> Edge Functions -> Create function)
// Keep "Verify JWT" ON (default). No extra secrets are needed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Please sign in." });

  // 1) who is calling?
  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: who, error: whoErr } = await caller.auth.getUser();
  if (whoErr || !who.user) return json(401, { error: "Your session has expired. Please sign in again." });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: prof } = await admin.from("profiles").select("role").eq("user_id", who.user.id).maybeSingle();
  if (prof?.role !== "admin") return json(403, { error: "Only an administrator can add doctors." });

  // 2) validate input
  let b: Record<string, any>;
  try { b = await req.json(); } catch { return json(400, { error: "Invalid request." }); }
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim();
  const password = String(b.password ?? "");
  const phone = String(b.phone ?? "").trim();
  const specialization = String(b.specialization ?? "").trim();
  const qualification = String(b.qualification ?? "").trim();
  const bio = String(b.bio ?? "").trim();
  const experience = Number(b.experience);
  const fee = Number(b.fee);
  const slotMinutes = Number(b.slotMinutes ?? 30);
  const languages: string[] = (Array.isArray(b.languages) ? b.languages : []).map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 10);
  const photo: string | null = b.photo ? String(b.photo) : null;
  const windows: { day: string; start: string; end: string }[] = Array.isArray(b.availability) ? b.availability : [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { error: "Enter a valid email address." });
  if (name.length < 5 || name.length > 120) return json(400, { error: "Enter the doctor's full name." });
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return json(400, { error: "Password must be 8+ characters with letters and numbers." });
  if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) return json(400, { error: "Enter a valid phone number." });
  if (!specialization) return json(400, { error: "Select a specialization." });
  if (qualification.length < 3) return json(400, { error: "Qualification is required." });
  if (!Number.isFinite(experience) || experience < 0 || experience > 60) return json(400, { error: "Experience must be 0-60 years." });
  if (!Number.isInteger(fee) || fee < 100 || fee > 1_000_000) return json(400, { error: "Consultation fee must be between Rs 100 and Rs 1,000,000." });
  if (bio.length < 20) return json(400, { error: "Biography must be at least 20 characters." });
  if (![10, 15, 20, 30, 45, 60].includes(slotMinutes)) return json(400, { error: "Invalid slot length." });
  if (photo && !photo.startsWith(`${url}/storage/v1/object/public/doctor-photos/`)) return json(400, { error: "Invalid photo address." });
  for (const w of windows) {
    if (!DAYS.includes(w.day) || !TIME.test(w.start) || !TIME.test(w.end) || toMin(w.start) >= toMin(w.end)) return json(400, { error: "Invalid working hours." });
  }
  for (let i = 0; i < windows.length; i++) for (let j = i + 1; j < windows.length; j++) {
    const x = windows[i], y = windows[j];
    if (x.day === y.day && toMin(x.start) < toMin(y.end) && toMin(y.start) < toMin(x.end)) return json(400, { error: `Overlapping working hours on ${x.day}.` });
  }

  // 3) duplicate protection (doctor record AND login)
  const { data: dup } = await admin.from("doctors").select("id").ilike("email", email).maybeSingle();
  if (dup) return json(409, { error: "A doctor with this email already exists." });

  // 4) create login -> profile -> doctor row -> availability; undo everything on any failure
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, app_metadata: { role: "doctor" }, user_metadata: { name },
  });
  if (cErr || !created.user) {
    const taken = /already|registered|exists/i.test(cErr?.message ?? "");
    return json(taken ? 409 : 400, { error: taken ? "An account with this email already exists." : (cErr?.message ?? "Could not create the login.") });
  }
  const userId = created.user.id;
  const doctorId = "d" + crypto.randomUUID().replace(/-/g, "").slice(0, 10);

  const rollback = async () => {
    await admin.from("availability").delete().eq("doctor_id", doctorId);
    await admin.from("profiles").delete().eq("user_id", userId);
    await admin.from("doctors").delete().eq("id", doctorId);
    await admin.auth.admin.deleteUser(userId);
  };

  const { error: dErr } = await admin.from("doctors").insert({
    id: doctorId, user_id: userId, name, email, phone, specialization, qualification, experience, rating: 0, fee,
    languages: languages.length ? languages : ["English"], bio, photo, slot_minutes: slotMinutes, approval_status: "approved", reviewed_at: new Date().toISOString(),
  });
  if (dErr) { await rollback(); return json(400, { error: `Could not save the doctor profile: ${dErr.message}` }); }

  const { error: pErr } = await admin.from("profiles").insert({ user_id: userId, role: "doctor", ref_id: doctorId });
  if (pErr) { await rollback(); return json(400, { error: `Could not link the login: ${pErr.message}` }); }

  if (windows.length) {
    const rows = windows.map((w, i) => ({ id: `w${doctorId}${i}`, doctor_id: doctorId, day: w.day, start_time: w.start, end_time: w.end }));
    const { error: aErr } = await admin.from("availability").insert(rows);
    if (aErr) { await rollback(); return json(400, { error: `Could not save working hours: ${aErr.message}` }); }
  }

  await admin.from("notifications").insert({
    id: "n" + crypto.randomUUID().replace(/-/g, ""), role: "admin", title: "Doctor added", body: `${name} (${specialization}) was added and approved.`,
  });
  return json(200, { ok: true, doctorId, userId });
});
