import { createSeed } from "@/lib/mock-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Appointment, ApprovalStatus, DataState, Doctor, Notification, Patient, Payment, Reschedule, Role, Session, Settings, Specialization, Weekday } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

export const BUSY_PREFIX = "busy:";

// ---------- app model -> table rows ----------
export function toRows(d: DataState): Tables {
  return {
    specializations: d.specializations.map((s) => ({ id: s.id, name: s.name, description: s.description, icon: s.icon })),
    doctors: d.doctors.map((x) => ({
      id: x.id, name: x.name, email: x.email.toLowerCase(), phone: x.phone, specialization: x.specialization, qualification: x.qualification,
      experience: x.experience, rating: x.rating, fee: x.fee, languages: x.languages, bio: x.bio, photo: x.photo ?? null, slot_minutes: x.slotMinutes,
    })),
    patients: d.patients.map((p) => ({
      id: p.id, name: p.name, email: p.email.toLowerCase(), phone: p.phone, dob: p.dob, gender: p.gender, address: p.address ?? null,
      blood_group: p.bloodGroup ?? null, registered_at: p.registeredAt,
    })),
    availability: d.doctors.flatMap((x) => x.availability.map((w) => ({ id: w.id, doctor_id: x.id, day: w.day, start_time: w.start, end_time: w.end }))),
    reviews: d.doctors.flatMap((x) => x.reviews.map((r) => ({ id: r.id, doctor_id: x.id, author: r.author, rating: r.rating, text: r.text, date: r.date }))),
    appointments: d.appointments.filter((a) => !a.id.startsWith(BUSY_PREFIX)).map((a) => ({
      id: a.id, ref: a.ref, patient_id: a.patientId, doctor_id: a.doctorId, date: a.date, time: a.time, reason: a.reason, status: a.status,
      created_at: a.createdAt, notes: a.notes ?? null,
    })),
    notifications: d.notifications.map((n) => ({ id: n.id, role: n.role, user_ref: n.userId ?? null, title: n.title, body: n.body, time: n.time, read: n.read })),
    settings: [{
      id: "main", site_name: d.settings.siteName, support_email: d.settings.supportEmail, support_phone: d.settings.supportPhone,
      slot_minutes: d.settings.slotMinutes, allow_registration: d.settings.allowRegistration, email_notifications: d.settings.emailNotifications,
      sms_notifications: d.settings.smsNotifications, appointment_reminders: d.settings.appointmentReminders,
      admin_name: d.settings.adminName, admin_email: d.settings.adminEmail, admin_phone: d.settings.adminPhone,
    }],
  };
}

// ---------- table rows -> app model ----------
export function emptyData(defaults: Settings): DataState {
  return { doctors: [], patients: [], appointments: [], specializations: [], notifications: [], settings: { ...defaults, adminPassword: "" }, payments: [], reschedules: [], applications: [], prescriptions: [], medicalRecords: [] };
}

export async function loadAll(sb: SupabaseClient, role: Role | undefined, defaults: Settings): Promise<DataState> {
  const q = (t: string) => sb.from(t).select("*");
  const [spec, doc, av, rev, pat, appt, notif, set, busy, pay, resch] = await Promise.all([
    q("specializations"), q("doctors"), q("availability"), q("reviews"), q("patients"), q("appointments"), q("notifications"), q("settings"),
    sb.from("busy_slots").select("*"), q("payments"), q("appointment_reschedules"),
  ]);
  const failed = [spec, doc, av, rev, set].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const availability = (av.data ?? []) as Row[];
  const reviews = (rev.data ?? []) as Row[];
  const allDoctors: Doctor[] = ((doc.data ?? []) as Row[]).map((r) => ({
    approval: (r.approval_status ?? "approved") as ApprovalStatus, registeredAt: r.registered_at ?? undefined,
    id: r.id, name: r.name, email: r.email, phone: r.phone, password: "", specialization: r.specialization, qualification: r.qualification,
    experience: r.experience, rating: Number(r.rating), fee: r.fee, languages: r.languages ?? [], bio: r.bio, photo: r.photo ?? undefined, slotMinutes: r.slot_minutes,
    availability: availability.filter((w) => w.doctor_id === r.id).map((w) => ({ id: w.id, day: w.day as Weekday, start: w.start_time, end: w.end_time })),
    reviews: reviews.filter((v) => v.doctor_id === r.id).map((v) => ({ id: v.id, author: v.author, rating: v.rating, text: v.text, date: v.date })).reverse(),
  }));
  // approved doctors form the directory; pending / rejected ones are only returned by the database to the admin and to the applicant
  const doctors = allDoctors.filter((d) => d.approval === "approved");
  const applications = allDoctors.filter((d) => d.approval !== "approved");
  const patients: Patient[] = ((pat.data ?? []) as Row[]).map((r) => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone, password: "", dob: r.dob, gender: r.gender, address: r.address ?? undefined,
    bloodGroup: r.blood_group ?? undefined, registeredAt: r.registered_at,
  }));
  const appointments: Appointment[] = ((appt.data ?? []) as Row[]).map((r) => ({
    id: r.id, ref: r.ref, patientId: r.patient_id, doctorId: r.doctor_id, date: r.date, time: r.time, reason: r.reason, status: r.status, createdAt: r.created_at, notes: r.notes ?? undefined,
  }));
  // other people's booked times (no patient data) so the slot picker can grey them out
  if (role !== "admin") {
    const mine = new Set(appointments.map((a) => `${a.doctorId}|${a.date}|${a.time}`));
    ((busy.data ?? []) as Row[]).forEach((b) => {
      if (mine.has(`${b.doctor_id}|${b.date}|${b.time}`)) return;
      appointments.push({ id: `${BUSY_PREFIX}${b.doctor_id}|${b.date}|${b.time}`, ref: "", patientId: "", doctorId: b.doctor_id, date: b.date, time: b.time, reason: "", status: "approved", createdAt: "" });
    });
  }
  const notifications: Notification[] = ((notif.data ?? []) as Row[])
    .map((r) => ({ id: r.id, role: r.role, userId: r.user_ref ?? undefined, title: r.title, body: r.body, time: r.time, read: r.read }))
    .sort((a, b) => (a.time < b.time ? 1 : -1));
  const s = ((set.data ?? []) as Row[])[0];
  const settings: Settings = s
    ? { siteName: s.site_name, supportEmail: s.support_email, supportPhone: s.support_phone, slotMinutes: s.slot_minutes, allowRegistration: s.allow_registration,
        emailNotifications: s.email_notifications, smsNotifications: s.sms_notifications, appointmentReminders: s.appointment_reminders,
        adminName: s.admin_name, adminEmail: s.admin_email, adminPhone: s.admin_phone, adminPassword: "" }
    : { ...defaults, adminPassword: "" };
  const payments: Payment[] = ((pay.data ?? []) as Row[]).map((r) => ({
    id: r.id, appointmentId: r.appointment_id, patientId: r.patient_id, doctorId: r.doctor_id, amount: r.amount, currency: r.currency, status: r.status,
    method: r.method, transactionId: r.transaction_id, paidAt: r.paid_at,
  }));
  const reschedules: Reschedule[] = ((resch.data ?? []) as Row[]).map((r) => ({
    id: r.id, appointmentId: r.appointment_id, doctorId: r.doctor_id, oldDate: r.old_date, oldTime: r.old_time, newDate: r.new_date, newTime: r.new_time,
    reason: r.reason ?? "", createdAt: r.created_at,
  })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const out: DataState = { doctors, patients, appointments, specializations: ((spec.data ?? []) as Row[]).map((r) => ({ id: r.id, name: r.name, description: r.description, icon: r.icon }) as Specialization), notifications, settings, payments, reschedules, applications, prescriptions: [], medicalRecords: [] };
  // Database not seeded yet: show the built-in showcase doctors so the public pages are never empty.
  if (!out.doctors.length) { const demo = createSeed(); out.doctors = demo.doctors.map((d) => ({ ...d, password: "" })); if (!out.specializations.length) out.specializations = demo.specializations; }
  return out;
}

export async function fetchSession(sb: SupabaseClient): Promise<Session | null> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  let { data: p } = await sb.from("profiles").select("role,ref_id").eq("user_id", u.user.id).maybeSingle();
  if (!p) {
    // first sign-in: create/link the profile (patients: created here; doctor applications: created as PENDING; doctors/admin: only if set up with the service key)
    await sb.rpc("claim_profile");
    p = (await sb.from("profiles").select("role,ref_id").eq("user_id", u.user.id).maybeSingle()).data;
  }
  if (!p) return null;
  // after a VERIFIED e-mail change in Supabase Auth, bring patients/doctors/settings e-mail in line (no-op when equal)
  await sb.rpc("sync_my_email");
  if (p.role === "doctor") {
    const { data: d } = await sb.from("doctors").select("approval_status").eq("id", p.ref_id).maybeSingle();
    return { role: "doctor", userId: p.ref_id as string, approval: ((d?.approval_status as ApprovalStatus | undefined) ?? "approved") };
  }
  return { role: p.role as Role, userId: p.ref_id as string };
}

// ---------- push changes (diff between two states) ----------
const UPSERT_ORDER = ["specializations", "doctors", "patients", "availability", "reviews", "appointments", "notifications", "settings"];
const DELETE_ORDER = ["notifications", "appointments", "reviews", "availability", "patients", "doctors", "specializations"];
// which tables each role is allowed to change (Row Level Security enforces this again on the server)
const ALLOWED: Record<Role, string[]> = {
  admin: UPSERT_ORDER,
  doctor: ["doctors", "availability", "appointments", "notifications"],
  patient: ["patients", "reviews", "appointments", "notifications"],
};

export interface PushError { message: string; code?: string }

export async function pushDiff(sb: SupabaseClient, prev: DataState, next: DataState, role: Role): Promise<PushError | null> {
  const a = toRows(prev), b = toRows(next);
  const allowed = new Set(ALLOWED[role]);
  const map = (rows: Row[]) => new Map(rows.map((r) => [r.id as string, JSON.stringify(r)]));
  for (const t of UPSERT_ORDER) {
    if (!allowed.has(t)) continue;
    const pm = map(a[t]);
    const changed = b[t].filter((r) => pm.get(r.id) !== JSON.stringify(r));
    if (!changed.length) continue;
    // NEW rows use a plain INSERT and CHANGED rows a plain UPDATE. (An UPSERT also runs the table's SELECT policy on the new row, which made
    // cross-role rows such as a patient's notification for a doctor fail with "new row violates row-level security policy".)
    const fresh = changed.filter((r) => !pm.has(r.id));
    const edited = changed.filter((r) => pm.has(r.id));
    if (fresh.length) {
      const { error } = await sb.from(t).insert(fresh);
      if (error) return { message: error.message, code: error.code };
    }
    const results = await Promise.all(edited.map((r) => sb.from(t).update(r).eq("id", r.id).select("id")));
    for (const res of results) {
      if (res.error) return { message: res.error.message, code: res.error.code };
      if (!res.data || res.data.length === 0) return { message: "You are not allowed to change this record, or it no longer exists." };
    }
  }
  for (const t of DELETE_ORDER) {
    if (!allowed.has(t)) continue;
    const nm = new Set(b[t].map((r) => r.id as string));
    const gone = a[t].filter((r) => !nm.has(r.id)).map((r) => r.id as string);
    if (!gone.length) continue;
    const { error } = await sb.from(t).delete().in("id", gone);
    if (error) return { message: error.message, code: error.code };
  }
  return null;
}
