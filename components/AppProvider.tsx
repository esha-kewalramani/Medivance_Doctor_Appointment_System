"use client";
import { flushSync } from "react-dom";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { Appointment, AppointmentStatus, AvailabilityWindow, DataState, Doctor, MedicalRecord, Notification, Patient, Payment, Prescription, Reschedule, Role, Session, Settings, Specialization, Weekday } from "@/types";
import { createSeed } from "@/lib/mock-data";
import { KEYS, readJSON, removeKey, writeJSON } from "@/lib/storage";
import { genRef, genTransactionId, makeSlots, todayISO, toMin, uid, weekdayOf, fmtDate, fmtTime } from "@/lib/utilities";
import { toast } from "@/components/notifications/alerts";
import { getSupabase, siteUrl } from "@/lib/supabase/client";
import { fetchSession, loadAll, pushDiff } from "@/lib/supabase/sync";
import { createSlotOfferOnCancellation, acceptOffer, declineOfferAndPromoteNext } from "@/lib/slotOfferService";

// Backend mode: when NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set, everything is stored in Supabase. Otherwise the demo (LocalStorage) mode is used.
const sb = getSupabase();
const DEFAULT_SETTINGS = createSeed().settings;

export type Theme = "dark" | "light";
export type SlotState = { time: string; state: "free" | "booked" | "past" };
export interface CurrentUser { id: string; name: string; email: string; phone: string; photo?: string }
type Res<T = unknown> = ({ ok: true } & T) | { ok: false; error: string; code?: string };

/** Doctor self-registration form (Supabase mode). The doctor starts as PENDING until an admin approves. */
export interface DoctorApplication { name: string; email: string; password: string; phone: string; specialization: string; qualification: string; experience: number; fee: number; languages: string; bio: string }
/** Admin "Add New Doctor" form: the doctor is created already approved, by a server-side Edge Function. */
export interface AdminDoctorInput { name: string; email: string; password: string; phone: string; specialization: string; qualification: string; experience: number; fee: number; languages: string[]; bio: string; slotMinutes: number; availability: { day: Weekday; start: string; end: string }[] }

const cleanDbMessage = (m: string) => m.replace(/^SLOT_TAKEN:\s*/, "");

const OCCUPYING: AppointmentStatus[] = ["pending", "approved", "completed"];

export function windowsConflict(list: AvailabilityWindow[], w: Pick<AvailabilityWindow, "day" | "start" | "end">, ignoreId?: string) {
  return list.some((x) => x.id !== ignoreId && x.day === w.day && toMin(x.start) < toMin(w.end) && toMin(w.start) < toMin(x.end));
}

interface Ctx {
  ready: boolean;
  theme: Theme;
  toggleTheme: () => void;
  data: DataState;
  session: Session | null;
  user: CurrentUser | null;
  login: (role: Role, email: string, password: string, remember: boolean) => Res | Promise<Res>;
  logout: () => void;
  registerPatient: (p: Omit<Patient, "id" | "registeredAt">) => Res<{ patient: Patient; confirmEmail?: boolean }> | Promise<Res<{ patient: Patient; confirmEmail?: boolean }>>;
  changePassword: (current: string, next: string) => Res | Promise<Res>;
  doctorById: (id: string) => Doctor | undefined;
  patientById: (id: string) => Patient | undefined;
  getSlots: (doctorId: string, date: string) => SlotState[];
  bookAppointment: (a: { patientId: string; doctorId: string; date: string; time: string; reason: string }) => Res<{ appointment: Appointment }>;
  /** Simulated payment + booking in ONE step (nothing is saved unless it succeeds). */
  bookPaidAppointment: (a: { doctorId: string; date: string; time: string; reason: string; idempotencyKey: string }) => Promise<Res<{ appointment: Appointment; payment: Payment }>>;
  /** Guest booking without login (connects directly to centralized system) */
  bookGuestAppointment: (a: { doctorId: string; date: string; time: string; reason: string; guestDetails: { name: string; email: string; phone: string; gender?: string; age?: string }; idempotencyKey?: string }) => Promise<Res<{ appointment: Appointment; payment: Payment }>>;
  toggleAuraConsent: (patientId: string, consent: boolean) => void;
  addPrescription: (p: Omit<Prescription, "id" | "createdAt">) => Res<{ prescription: Prescription }>;
  addMedicalRecord: (r: Omit<MedicalRecord, "id" | "createdAt">) => Res<{ medicalRecord: MedicalRecord }>;
  rescheduleAppointment: (id: string, date: string, time: string, reason: string) => Promise<Res>;
  registerDoctor: (f: DoctorApplication) => Promise<Res<{ confirmEmail: boolean }>>;
  reviewApplication: (doctorId: string, decision: "approved" | "rejected") => Promise<Res>;
  createDoctorAsAdmin: (f: AdminDoctorInput, photo?: File | null) => Promise<Res>;
  requestPasswordReset: (email: string) => Promise<Res>;
  changeEmail: (newEmail: string) => Promise<Res<{ verificationSent: boolean }>>;
  refreshSession: () => Promise<void>;
  setStatus: (id: string, status: AppointmentStatus) => Res;
  cancelAppointment: (id: string) => Res;
  claimEarlierSlot: (offerId: string) => Res;
  declineEarlierSlot: (offerId: string) => void;
  addReview: (doctorId: string, r: { author: string; rating: number; text: string }) => Res;
  saveDoctor: (d: Doctor, isNew?: boolean) => Res;
  removeDoctor: (id: string) => void;
  savePatient: (p: Patient) => Res;
  removePatient: (id: string) => void;
  saveSpecialization: (s: Specialization, oldName?: string) => Res;
  removeSpecialization: (id: string) => Res;
  updateSettings: (s: Partial<Settings>) => void;
  notify: (n: Omit<Notification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  resetData: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside <AppProvider>");
  return c;
};

export default function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [data, setData] = useState<DataState>(() => createSeed());
  const [session, setSession] = useState<Session | null>(null);
  const dataRef = useRef<DataState>(data);
  const sessionRef = useRef<Session | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const demoIdem = useRef(new Map<string, { appointment: Appointment; payment: Payment }>());

  /** Re-read everything this user may see from Supabase (skipped while a save is still in flight). */
  const reload = useCallback(async () => {
    if (!sb || pending.current) return;
    try {
      const s = await fetchSession(sb);
      const d = await loadAll(sb, s?.role, DEFAULT_SETTINGS);
      if (d && d.doctors && d.doctors.length > 0 && !pending.current) { dataRef.current = d; setData(d); }
      if (s && sessionRef.current && s.approval !== sessionRef.current.approval) { sessionRef.current = s; setSession(s); }
    } catch { /* offline: keep what is on screen */ }
  }, []);

  const commit = useCallback((fn: (d: DataState) => DataState) => {
    const prev = dataRef.current;
    const next = fn(prev);
    dataRef.current = next;
    setData(next);
    writeJSON(KEYS.data, next);
    const role = sessionRef.current?.role;
    if (sb && role) {
      pending.current++;
      queue.current = queue.current.then(async () => {
        let err: { message: string; code?: string } | null = null;
        try { err = await pushDiff(sb, prev, next, role); } catch (e) { err = { message: (e as Error).message }; }
        pending.current--;
        if (err) {
          const taken = err.code === "23505";
          toast("error", taken ? "That time was just booked by someone else" : "Could not save your change", taken ? "Please choose another slot." : err.message);
          await reload();
        }
      });
    }
  }, [reload]);

  // ---------- boot from LocalStorage ----------
  useEffect(() => {
    const t = (readJSON<Theme>(KEYS.theme) || (document.documentElement.dataset.theme as Theme) || "dark");
    setThemeState(t);
    document.documentElement.dataset.theme = t;

    // 1. ALWAYS load saved data from LocalStorage first so registered accounts are NEVER lost
    const saved = readJSON<DataState>(KEYS.data);
    if (saved && saved.doctors && saved.appointments) {
      const seed = createSeed();
      if (!saved.doctors.length) saved.doctors = seed.doctors;
      if (!saved.specializations?.length) saved.specializations = seed.specializations;
      if (!saved.patients?.length) saved.patients = seed.patients;

      const existingDocIds = new Set(saved.doctors.map((d) => d.id));
      for (const sd of seed.doctors) {
        if (!existingDocIds.has(sd.id)) saved.doctors.push(sd);
      }

      const existingSpecs = new Set(saved.specializations.map((s) => s.name.toLowerCase()));
      for (const sp of seed.specializations) {
        if (!existingSpecs.has(sp.name.toLowerCase())) saved.specializations.push(sp);
      }

      saved.payments = saved.payments ?? [];
      saved.reschedules = saved.reschedules ?? [];
      saved.applications = saved.applications ?? [];
      saved.prescriptions = saved.prescriptions ?? seed.prescriptions;
      saved.medicalRecords = saved.medicalRecords ?? seed.medicalRecords;

      // Ensure patient p1 (Esha) has today's live booked appointment with Dr. Ayesha Khan
      const today = todayISO();
      const hasLiveToday = saved.appointments.some(
        (a) => a.patientId === "p1" && a.date === today && a.status === "approved"
      );
      if (!hasLiveToday) {
        saved.appointments.unshift({
          id: `appt-real-1415`,
          ref: `MDV-2026-LIVE`,
          patientId: "p1",
          doctorId: "d1",
          date: today,
          time: "14:15",
          reason: "Cardiovascular health evaluation & routine blood pressure checkup",
          status: "approved",
          createdAt: new Date().toISOString(),
        });
        writeJSON(KEYS.data, saved);
      }

      dataRef.current = saved;
      setData(saved);
    } else {
      writeJSON(KEYS.data, dataRef.current);
    }

    // 2. Load saved session from storage
    const savedSession = readJSON<Session>(KEYS.session) || readJSON<Session>(KEYS.session, "session");
    if (savedSession) {
      sessionRef.current = savedSession;
      setSession(savedSession);
    }

    // 3. Mark ready immediately as local state is initialized
    setReady(true);

    // 4. If Supabase is configured, attempt background sync
    let unsubscribeSb: (() => void) | undefined;
    if (sb) {
      (async () => {
        try {
          const s = await fetchSession(sb);
          if (s) {
            sessionRef.current = s;
            setSession(s);
          }
          const d = await loadAll(sb, s?.role, DEFAULT_SETTINGS);
          if (d && d.doctors && d.doctors.length > 0) {
            dataRef.current = d;
            setData(d);
            writeJSON(KEYS.data, d);
          }
        } catch {
          // offline/unreachable: retain LocalStorage data
        }
      })();
      const { data: sub } = sb.auth.onAuthStateChange((ev) => {
        if (ev === "SIGNED_OUT") {
          sessionRef.current = null;
          setSession(null);
        }
      });
      unsubscribeSb = () => {
        sub.subscription.unsubscribe();
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.data && e.newValue) {
        try {
          const d = JSON.parse(e.newValue);
          dataRef.current = d;
          setData(d);
        } catch {}
      }
      if (e.key === KEYS.theme && e.newValue) {
        const v = JSON.parse(e.newValue) as Theme;
        setThemeState(v);
        document.documentElement.dataset.theme = v;
      }
    };
    window.addEventListener("storage", onStorage);

    let bcSync: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bcSync = new BroadcastChannel("medivance_sync");
      bcSync.onmessage = (ev) => {
        if (ev.data?.type === "DATA_SYNC" && ev.data.data) {
          dataRef.current = ev.data.data;
          setData(ev.data.data);
        }
      };
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      if (bcSync) bcSync.close();
      if (unsubscribeSb) unsubscribeSb();
    };
  }, []);

  useEffect(() => {
    if (ready) writeJSON(KEYS.data, data);
  }, [data, ready]);

  // pick up other people's changes (for example a doctor approving a booking)
  useEffect(() => {
    if (!sb || !session) return;
    const t = setInterval(reload, 25000);
    const v = () => { if (document.visibilityState === "visible") reload(); };
    document.addEventListener("visibilitychange", v);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", v); };
  }, [session, reload]);

  // ---------- theme ----------
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === "light" ? "dark" : "light";
    const apply = () => { root.dataset.theme = next; setThemeState(next); writeJSON(KEYS.theme, next); };
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (d.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { d.startViewTransition(() => { flushSync(apply); }); return; }
    root.classList.add("theme-anim");
    apply();
    window.setTimeout(() => root.classList.remove("theme-anim"), 600);
  }, []);

  // ---------- notifications ----------
  const notify = useCallback((n: Omit<Notification, "id" | "time" | "read">) => {
    commit((d) => ({ ...d, notifications: [{ ...n, id: uid("n"), time: new Date().toISOString(), read: false }, ...d.notifications].slice(0, 80) }));
  }, [commit]);

  const doctorById = useCallback((id: string) => data.doctors.find((d) => d.id === id), [data.doctors]);
  const patientById = useCallback((id: string) => data.patients.find((p) => p.id === id), [data.patients]);

  // ---------- auth ----------
  const login: Ctx["login"] = (role, email, password, remember) => {
    return (async (): Promise<Res<{ role?: Role }>> => {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try Supabase authentication if available
      if (sb) {
        try {
          const { error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
          if (!error) {
            const s = await fetchSession(sb);
            if (s) {
              // Strictly verify portal role matching
              if (s.role !== role) {
                // Immediate sign out from Supabase so mismatched session does not linger
                await sb.auth.signOut();
                const actualName = s.role === "doctor" ? "Doctor" : s.role === "admin" ? "Administrator" : "Patient";
                return {
                  ok: false,
                  error: `This account is registered as a ${actualName}. Please switch to the ${actualName} Portal to sign in.`,
                };
              }
              sessionRef.current = s;
              setSession(s);
              writeJSON(KEYS.session, s, remember ? "local" : "session");
              await reload();
              return { ok: true, role: s.role };
            }
          }
        } catch {
          // If Supabase fetch fails (e.g. offline/network), fall through to local storage
        }
      }

      // 2. Local Storage Authentication Fallback
      const currentData = dataRef.current;
      const isAdminEmail = cleanEmail === currentData.settings.adminEmail.toLowerCase();
      const inDoctors = currentData.doctors.find((x) => x.email.toLowerCase() === cleanEmail);
      const inPatients = currentData.patients.find((x) => x.email.toLowerCase() === cleanEmail);

      // Check admin portal
      if (role === "admin") {
        if (isAdminEmail && password === currentData.settings.adminPassword) {
          const s: Session = { role: "admin", userId: "admin1" };
          removeKey(KEYS.session);
          removeKey(KEYS.session, "session");
          writeJSON(KEYS.session, s, remember ? "local" : "session");
          sessionRef.current = s;
          setSession(s);
          return { ok: true, role: "admin" };
        }
        if (inDoctors || inPatients) {
          const actual = inDoctors ? "Doctor" : "Patient";
          return { ok: false, error: `This account is registered as a ${actual}. Please use the ${actual} Portal.` };
        }
        return { ok: false, error: "Incorrect admin email or password." };
      }

      // If user attempted to log in as doctor or patient using admin credentials
      if (isAdminEmail && password === currentData.settings.adminPassword) {
        return {
          ok: false,
          error: "This account is registered as an Administrator. Please use the Administrator Portal to sign in.",
        };
      }

      // Strict role verification for Patient Portal
      if (role === "patient") {
        if (inDoctors && !inPatients) {
          return {
            ok: false,
            error: "This account is registered as a Doctor. Please switch to the Doctor Portal to sign in.",
          };
        }
        if (!inPatients) {
          return { ok: false, error: "No patient account found with this email. Please check your email or register." };
        }
        if (inPatients.password && inPatients.password !== password) {
          return { ok: false, error: "Incorrect password. Please try again." };
        }
        const s: Session = {
          role: "patient",
          userId: inPatients.id,
        };
        removeKey(KEYS.session);
        removeKey(KEYS.session, "session");
        writeJSON(KEYS.session, s, remember ? "local" : "session");
        sessionRef.current = s;
        setSession(s);
        return { ok: true, role: "patient" };
      }

      // Strict role verification for Doctor Portal
      if (role === "doctor") {
        if (inPatients && !inDoctors) {
          return {
            ok: false,
            error: "This account is registered as a Patient. Please switch to the Patient Portal to sign in.",
          };
        }
        if (!inDoctors) {
          return { ok: false, error: "No doctor account found with this email. Please contact the administrator." };
        }
        if (inDoctors.password && inDoctors.password !== password) {
          return { ok: false, error: "Incorrect password. Please try again." };
        }
        const s: Session = {
          role: "doctor",
          userId: inDoctors.id,
          approval: (inDoctors as any).approval_status ?? "approved",
        };
        removeKey(KEYS.session);
        removeKey(KEYS.session, "session");
        writeJSON(KEYS.session, s, remember ? "local" : "session");
        sessionRef.current = s;
        setSession(s);
        return { ok: true, role: "doctor" };
      }

      return { ok: false, error: "Invalid role specified." };
    })();
  };

  const logout = () => {
    sessionRef.current = null;
    setSession(null);
    removeKey(KEYS.session);
    removeKey(KEYS.session, "session");
    if (sb) {
      try {
        sb.auth.signOut().catch(() => {});
      } catch {}
    }
  };

  const registerPatient: Ctx["registerPatient"] = (p) => {
    return (async (): Promise<Res<{ patient: Patient; confirmEmail?: boolean }>> => {
      if (!dataRef.current.settings.allowRegistration) {
        return { ok: false, error: "Registration is currently disabled by the administrator." };
      }
      const email = p.email.trim().toLowerCase();
      if (dataRef.current.patients.some((x) => x.email.toLowerCase() === email)) {
        return { ok: false, error: "An account with this email already exists." };
      }

      // Try Supabase if available
      if (sb) {
        try {
          const { data: r, error } = await sb.auth.signUp({
            email,
            password: p.password || "",
            options: {
              data: {
                name: p.name,
                phone: p.phone,
                dob: p.dob,
                gender: p.gender,
                address: p.address ?? null,
                blood_group: p.bloodGroup ?? null,
              },
            },
          });

          if (error) {
            console.error("[Supabase Patient Registration Error]:", error);
            return {
              ok: false,
              error: /registered|exists/i.test(error.message)
                ? "An account with this email already exists in Supabase. Please sign in instead."
                : error.message,
            };
          }

          if (r.user && Array.isArray(r.user.identities) && r.user.identities.length === 0) {
            return {
              ok: false,
              error: "An account with this email already exists in Supabase. Please sign in instead.",
            };
          }

          // Case A: Supabase project has "Confirm email" enabled -> no immediate session until confirmed
          if (!r.session) {
            return {
              ok: true,
              confirmEmail: true,
              patient: {
                ...p,
                email,
                id: r.user?.id || uid("p"),
                registeredAt: new Date().toISOString(),
                isGuest: false,
              },
            };
          }

          // Case B: Session returned -> claim profile into public.patients and sync immediately
          const { error: ce } = await sb.rpc("claim_profile");
          if (ce) {
            console.warn("[claim_profile]:", ce.message);
          }

          const s = await fetchSession(sb);
          if (s) {
            sessionRef.current = s;
            setSession(s);
            writeJSON(KEYS.session, s);
            await reload();
            const pat = dataRef.current.patients.find((x) => x.id === s.userId);
            if (pat) return { ok: true, patient: pat, confirmEmail: false };
          }
        } catch (err) {
          console.error("[Supabase Patient Registration Exception]:", err);
          return { ok: false, error: (err as Error)?.message || "Failed to register in Supabase." };
        }
      }

      // Local / Offline fallback creation with password stored (when Supabase is not configured)
      const patient: Patient = {
        ...p,
        email,
        password: p.password,
        id: uid("p"),
        registeredAt: new Date().toISOString(),
        isGuest: false,
      };

      const nextData = {
        ...dataRef.current,
        patients: [...dataRef.current.patients, patient],
      };
      dataRef.current = nextData;
      setData(nextData);
      writeJSON(KEYS.data, nextData);

      const s: Session = { role: "patient", userId: patient.id };
      sessionRef.current = s;
      setSession(s);
      writeJSON(KEYS.session, s);

      notify({
        role: "admin",
        title: "New patient registered",
        body: `${patient.name} just created an account.`,
      });

      return { ok: true, patient };
    })();
  };

  // ---------- slots & appointments ----------
  const slotsFrom = (d: DataState, doctorId: string, date: string): SlotState[] => {
    const doc = d.doctors.find((x) => x.id === doctorId);
    if (!doc || !date) return [];
    const day = weekdayOf(date);
    const times = Array.from(new Set(doc.availability.filter((w) => w.day === day).flatMap((w) => makeSlots(w.start, w.end, doc.slotMinutes)))).sort();
    const taken = new Set(d.appointments.filter((a) => a.doctorId === doctorId && a.date === date && OCCUPYING.includes(a.status)).map((a) => a.time));
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return times.map((time) => ({
      time,
      state: taken.has(time) ? "booked" : date < todayISO() || (date === todayISO() && toMin(time) <= nowMin) ? "past" : "free",
    }));
  };
  const getSlots = useCallback((doctorId: string, date: string) => slotsFrom(data, doctorId, date), [data]);

  const bookAppointment: Ctx["bookAppointment"] = ({ patientId, doctorId, date, time, reason }) => {
    const d = dataRef.current;
    const doc = d.doctors.find((x) => x.id === doctorId);
    const pat = d.patients.find((x) => x.id === patientId);
    if (!doc || !pat) return { ok: false, error: "Doctor or patient not found." };
    const slot = slotsFrom(d, doctorId, date).find((s) => s.time === time);
    if (!slot) return { ok: false, error: "This time is not part of the doctor's schedule." };
    if (slot.state === "booked") return { ok: false, error: "Sorry, this slot was just booked by someone else. Please choose another time." };
    if (slot.state === "past") return { ok: false, error: "This time has already passed." };
    const appointment: Appointment = { id: uid("a"), ref: genRef(), patientId, doctorId, date, time, reason: reason.trim(), status: "approved", createdAt: new Date().toISOString() };
    commit((x) => ({ ...x, appointments: [appointment, ...x.appointments] }));
    notify({ role: "doctor", userId: doctorId, title: "New appointment confirmed", body: `${pat.name} booked and confirmed for ${fmtDate(date)} at ${fmtTime(time)} (${appointment.ref}).` });
    notify({ role: "admin", title: "New booking", body: `${pat.name} booked ${doc.name} - ${appointment.ref}.` });
    notify({ role: "patient", userId: patientId, title: "Appointment Confirmed", body: `Your consultation ${appointment.ref} with ${doc.name} is confirmed for ${fmtDate(date)} at ${fmtTime(time)}.` });
    return { ok: true, appointment };
  };


  // ---------- simulated payment + booking (one atomic step) ----------
  const bookPaidAppointment: Ctx["bookPaidAppointment"] = async ({ doctorId, date, time, reason, idempotencyKey }) => {
    const sess = sessionRef.current ?? session;
    if (!sess || sess.role !== "patient") return { ok: false, error: "Please sign in as a patient to book an appointment." };
    if (sb) {
      const { data: r, error } = await sb.rpc("book_appointment_paid", { p_doctor_id: doctorId, p_date: date, p_time: time, p_reason: reason, p_idempotency_key: idempotencyKey });
      if (error || !r) {
        if (error?.code === "23505") void reload(); // the slot picker should show the newly taken time
        return { ok: false, error: cleanDbMessage(error?.message ?? "The payment could not be completed. You were not charged."), code: error?.code };
      }
      const a = r.appointment, p = r.payment;
      const appointment: Appointment = { id: a.id, ref: a.ref, patientId: a.patient_id, doctorId: a.doctor_id, date: a.date, time: a.time, reason: a.reason, status: a.status, createdAt: a.created_at };
      const payment: Payment = { id: p.id, appointmentId: p.appointment_id, patientId: p.patient_id, doctorId: p.doctor_id, amount: p.amount, currency: p.currency, status: p.status, method: p.method, transactionId: p.transaction_id, paidAt: p.paid_at };
      const cur = dataRef.current;
      const merged: DataState = { ...cur, appointments: [appointment, ...cur.appointments.filter((x) => x.id !== appointment.id)], payments: [payment, ...cur.payments.filter((x) => x.id !== payment.id)] };
      dataRef.current = merged; setData(merged);
      void reload(); // brings in the notifications the database created
      return { ok: true, appointment, payment };
    }
    // demo mode (LocalStorage): same rules, simulated locally
    const prior = demoIdem.current.get(idempotencyKey);
    if (prior) return { ok: true, ...prior };
    const d = dataRef.current;
    const doc = d.doctors.find((x) => x.id === doctorId);
    const pat = d.patients.find((x) => x.id === sess.userId);
    if (!doc || !pat) return { ok: false, error: "Doctor or patient not found." };
    const slot = slotsFrom(d, doctorId, date).find((x) => x.time === time);
    if (!slot) return { ok: false, error: "This time is not part of the doctor's schedule." };
    if (slot.state === "booked") return { ok: false, error: "Sorry, this slot was just booked by someone else. Please choose another time.", code: "23505" };
    if (slot.state === "past") return { ok: false, error: "This time has already passed." };
    const appointment: Appointment = { id: uid("a"), ref: genRef(), patientId: pat.id, doctorId, date, time, reason: reason.trim(), status: "approved", createdAt: new Date().toISOString() };
    const payment: Payment = { id: uid("pay"), appointmentId: appointment.id, patientId: pat.id, doctorId, amount: doc.fee, currency: "PKR", status: "paid", method: "DEMO / SIMULATED PAYMENT", transactionId: genTransactionId(), paidAt: new Date().toISOString() };
    commit((x) => ({ ...x, appointments: [appointment, ...x.appointments], payments: [payment, ...x.payments] }));
    demoIdem.current.set(idempotencyKey, { appointment, payment });
    notify({ role: "doctor", userId: doctorId, title: "New appointment confirmed", body: `${pat.name} confirmed for ${fmtDate(date)} at ${fmtTime(time)} (${appointment.ref}). Consultation fee paid.` });
    notify({ role: "admin", title: "New booking", body: `${pat.name} booked ${doc.name} - ${appointment.ref} (simulated payment ${payment.transactionId}).` });
    notify({ role: "patient", userId: pat.id, title: "Appointment Confirmed", body: `Your visit with ${doc.name} on ${fmtDate(date)} at ${fmtTime(time)} is confirmed! Reference: ${appointment.ref}.` });
    return { ok: true, appointment, payment };
  };

  // ---------- guest booking (without login) ----------
  const bookGuestAppointment: Ctx["bookGuestAppointment"] = async ({ doctorId, date, time, reason, guestDetails, idempotencyKey }) => {
    if (idempotencyKey) {
      const prior = demoIdem.current.get(idempotencyKey);
      if (prior) return { ok: true, ...prior };
    }
    const d = dataRef.current;
    const doc = d.doctors.find((x) => x.id === doctorId);
    if (!doc) return { ok: false, error: "Doctor not found." };
    const slot = slotsFrom(d, doctorId, date).find((x) => x.time === time);
    if (!slot) return { ok: false, error: "This time is not part of the doctor's schedule." };
    if (slot.state === "booked") return { ok: false, error: "Sorry, this slot was just booked by someone else. Please choose another time.", code: "23505" };
    if (slot.state === "past") return { ok: false, error: "This time has already passed." };

    const emailLower = guestDetails.email.trim().toLowerCase();

    // 1. Try Supabase backend guest booking RPC if Supabase is connected
    if (sb) {
      try {
        const { data: r, error } = await sb.rpc("book_appointment_guest", {
          p_doctor_id: doctorId,
          p_date: date,
          p_time: time,
          p_reason: reason.trim() || "General Medical Consultation",
          p_name: guestDetails.name.trim(),
          p_email: emailLower,
          p_phone: guestDetails.phone.trim(),
          p_gender: guestDetails.gender || "Other",
          p_age: guestDetails.age || null,
          p_idempotency_key: idempotencyKey || null,
        });

        if (!error && r?.appointment) {
          const a = r.appointment;
          const p = r.payment;
          const appointment: Appointment = {
            id: a.id,
            ref: a.ref,
            patientId: a.patient_id,
            doctorId: a.doctor_id,
            date: a.date,
            time: a.time,
            reason: a.reason,
            status: a.status,
            createdAt: a.created_at,
            isGuest: true,
            guestDetails: {
              name: guestDetails.name.trim(),
              email: emailLower,
              phone: guestDetails.phone.trim(),
              gender: guestDetails.gender,
              age: guestDetails.age,
            },
          };
          const payment: Payment = p ? {
            id: p.id,
            appointmentId: p.appointment_id,
            patientId: p.patient_id,
            doctorId: p.doctor_id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            method: p.method,
            transactionId: p.transaction_id,
            paidAt: p.paid_at,
          } : {
            id: uid("pay"),
            appointmentId: appointment.id,
            patientId: a.patient_id,
            doctorId,
            amount: doc.fee,
            currency: "PKR",
            status: "paid",
            method: "DEMO / SIMULATED PAYMENT (GUEST)",
            transactionId: genTransactionId(),
            paidAt: new Date().toISOString(),
          };

          const cur = dataRef.current;
          const merged: DataState = {
            ...cur,
            appointments: [appointment, ...cur.appointments.filter((x) => x.id !== appointment.id)],
            payments: [payment, ...cur.payments.filter((x) => x.id !== payment.id)],
          };
          dataRef.current = merged;
          setData(merged);
          writeJSON(KEYS.data, merged);

          // Broadcast to other open windows/tabs
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const bc = new BroadcastChannel("medivance_sync");
            bc.postMessage({ type: "DATA_SYNC", data: merged });
            bc.close();
          }

          notify({
            role: "doctor",
            userId: doctorId,
            title: "New Appointment Confirmed",
            body: `${guestDetails.name.trim()} confirmed for ${fmtDate(date)} at ${fmtTime(time)} (${appointment.ref}). Phone: ${guestDetails.phone.trim()}.`,
          });
          notify({
            role: "admin",
            title: "New Booking (Guest)",
            body: `${guestDetails.name.trim()} booked ${doc.name} - ${appointment.ref} (Fee: Rs ${doc.fee}).`,
          });

          return { ok: true, appointment, payment };
        } else if (error) {
          if (error.code === "23505" || /taken|booked/i.test(error.message)) {
            return { ok: false, error: "Sorry, this slot was just booked by someone else. Please choose another time.", code: "23505" };
          }
          console.warn("[book_appointment_guest fallback]:", error.message);
        }
      } catch (err) {
        console.warn("[book_appointment_guest error]:", err);
      }
    }

    let pat = d.patients.find((x) => x.email.toLowerCase() === emailLower);
    let isNewPatient = false;
    if (!pat) {
      isNewPatient = true;
      pat = {
        id: uid("p"),
        name: guestDetails.name.trim(),
        email: emailLower,
        phone: guestDetails.phone.trim(),
        dob: guestDetails.age ? `${new Date().getFullYear() - parseInt(guestDetails.age)}-01-01` : "2000-01-01",
        gender: (guestDetails.gender as "Male" | "Female" | "Other") || "Other",
        registeredAt: new Date().toISOString(),
        isGuest: true,
        auraConsent: false,
      };
    }

    const appointment: Appointment = {
      id: uid("a"),
      ref: genRef(),
      patientId: pat.id,
      doctorId,
      date,
      time,
      reason: reason.trim(),
      status: "approved",
      createdAt: new Date().toISOString(),
      isGuest: true,
      guestDetails: {
        name: guestDetails.name.trim(),
        email: emailLower,
        phone: guestDetails.phone.trim(),
        gender: guestDetails.gender,
        age: guestDetails.age,
      },
    };

    const payment: Payment = {
      id: uid("pay"),
      appointmentId: appointment.id,
      patientId: pat.id,
      doctorId,
      amount: doc.fee,
      currency: "PKR",
      status: "paid",
      method: "DEMO / SIMULATED PAYMENT (GUEST)",
      transactionId: genTransactionId(),
      paidAt: new Date().toISOString(),
    };

    commit((x) => ({
      ...x,
      patients: isNewPatient ? [...x.patients, pat!] : x.patients,
      appointments: [appointment, ...x.appointments],
      payments: [payment, ...x.payments],
    }));

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("medivance_sync");
      bc.postMessage({ type: "DATA_SYNC", data: dataRef.current });
      bc.close();
    }

    if (idempotencyKey) {
      demoIdem.current.set(idempotencyKey, { appointment, payment });
    }

    notify({
      role: "doctor",
      userId: doctorId,
      title: "New Appointment Confirmed",
      body: `${guestDetails.name.trim()} confirmed for ${fmtDate(date)} at ${fmtTime(time)} (${appointment.ref}). Phone: ${guestDetails.phone.trim()}.`,
    });
    notify({
      role: "admin",
      title: "New Booking (Guest)",
      body: `${guestDetails.name.trim()} booked ${doc.name} - ${appointment.ref} (Fee: Rs ${doc.fee}).`,
    });

    return { ok: true, appointment, payment };
  };

  const toggleAuraConsent: Ctx["toggleAuraConsent"] = (patientId, consent) => {
    commit((x) => ({
      ...x,
      patients: x.patients.map((p) => (p.id === patientId ? { ...p, auraConsent: consent } : p)),
    }));
    toast("info", consent ? "Aura AI access enabled" : "Aura AI access revoked", consent ? "Aura can now assist you with your medical history and prescriptions." : "Aura no longer has access to your medical history.");
  };

  const addPrescription: Ctx["addPrescription"] = (p) => {
    const prescription: Prescription = {
      ...p,
      id: uid("pr"),
      createdAt: new Date().toISOString(),
    };
    commit((x) => ({ ...x, prescriptions: [prescription, ...(x.prescriptions || [])] }));
    notify({ role: "patient", userId: p.patientId, title: "New Prescription Added", body: `${p.doctorName} prescribed ${p.medications.map((m) => m.name).join(", ")}.` });
    toast("success", "Prescription saved", `Prescription recorded for patient.`);
    return { ok: true, prescription };
  };

  const addMedicalRecord: Ctx["addMedicalRecord"] = (r) => {
    const medicalRecord: MedicalRecord = {
      ...r,
      id: uid("mr"),
      createdAt: new Date().toISOString(),
    };
    commit((x) => ({ ...x, medicalRecords: [medicalRecord, ...(x.medicalRecords || [])] }));
    notify({ role: "patient", userId: r.patientId, title: "Medical Record Updated", body: `Consultation record from ${r.doctorName} has been recorded.` });
    toast("success", "Medical record saved", `Clinical notes and diagnosis recorded.`);
    return { ok: true, medicalRecord };
  };

  // ---------- doctor-initiated rescheduling ----------
  const rescheduleAppointment: Ctx["rescheduleAppointment"] = async (id, date, time, reason) => {
    const sess = sessionRef.current ?? session;
    if (!sess || sess.role !== "doctor") return { ok: false, error: "Only the assigned doctor can reschedule an appointment." };
    const d = dataRef.current;
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return { ok: false, error: "Appointment not found." };
    if (a.doctorId !== sess.userId) return { ok: false, error: "You can only reschedule appointments assigned to you." };
    if (a.status === "cancelled") return { ok: false, error: "Cancelled appointments cannot be rescheduled." };
    if (a.status !== "pending" && a.status !== "approved") return { ok: false, error: `Only pending or approved appointments can be rescheduled (this one is ${a.status}).` };
    if (a.date === date && a.time === time) return { ok: false, error: "Please choose a different date or time." };
    const entry: Reschedule = { id: uid("rs"), appointmentId: id, doctorId: a.doctorId, oldDate: a.date, oldTime: a.time, newDate: date, newTime: time, reason: reason.trim().slice(0, 500), createdAt: new Date().toISOString() };
    if (sb) {
      const { error } = await sb.rpc("reschedule_appointment", { p_appointment_id: id, p_new_date: date, p_new_time: time, p_reason: entry.reason });
      if (error) { if (error.code === "23505") void reload(); return { ok: false, error: cleanDbMessage(error.message), code: error.code }; }
      const cur = dataRef.current;
      const next: DataState = { ...cur, appointments: cur.appointments.map((x) => (x.id === id ? { ...x, date, time } : x)), reschedules: [entry, ...cur.reschedules] };
      dataRef.current = next; setData(next);
      void reload(); // history + notifications as stored by the database
      return { ok: true };
    }
    const slot = slotsFrom(d, a.doctorId, date).find((x) => x.time === time);
    if (!slot) return { ok: false, error: "This time is not part of your schedule." };
    if (slot.state === "booked") return { ok: false, error: "That time already has another appointment. Please choose a free slot.", code: "23505" };
    if (slot.state === "past") return { ok: false, error: "This time has already passed." };
    if (d.appointments.some((x) => x.id !== a.id && x.patientId === a.patientId && x.date === date && x.time === time && (x.status === "pending" || x.status === "approved")))
      return { ok: false, error: "The patient already has another appointment at that time. Please choose a different slot." };
    commit((x) => ({ ...x, appointments: x.appointments.map((y) => (y.id === id ? { ...y, date, time } : y)), reschedules: [entry, ...x.reschedules] }));
    const doc = d.doctors.find((x) => x.id === a.doctorId);
    notify({ role: "patient", userId: a.patientId, title: "Appointment rescheduled", body: `${doc?.name ?? "Your doctor"} moved ${a.ref} from ${fmtDate(a.date)} ${fmtTime(a.time)} to ${fmtDate(date)} ${fmtTime(time)}.${entry.reason ? ` Reason: ${entry.reason}` : ""} Your payment is unchanged.` });
    return { ok: true };
  };

  // ---------- doctor self-registration (PENDING until an admin approves) ----------
  const registerDoctor: Ctx["registerDoctor"] = async (f) => {
    const email = f.email.trim().toLowerCase();

    // Check if already exists locally
    if (dataRef.current.doctors.some((d) => d.email.toLowerCase() === email)) {
      return { ok: false, error: "A doctor with this email is already registered. Please sign in instead." };
    }

    if (sb) {
      try {
        const { data: taken, error: te } = await sb.rpc("doctor_email_taken", { p_email: email });
        if (te) throw new Error(te.message);
        if (taken) return { ok: false, error: "A doctor with this email is already registered. Please sign in instead." };
        const { data: r, error } = await sb.auth.signUp({
          email, password: f.password,
          options: { data: { doctor_application: true, name: f.name.trim(), phone: f.phone.trim(), specialization: f.specialization, qualification: f.qualification.trim(), experience: String(f.experience), fee: String(f.fee), languages: f.languages, bio: f.bio.trim() } },
        });
        if (error) return { ok: false, error: /registered|exists/i.test(error.message) ? "An account with this email already exists." : error.message };
        if (r.user && Array.isArray(r.user.identities) && r.user.identities.length === 0) return { ok: false, error: "An account with this email already exists." };
        if (!r.session) return { ok: true, confirmEmail: true };
        const { error: ce } = await sb.rpc("claim_profile");
        const filed = !ce && r.user ? (await sb.from("profiles").select("role").eq("user_id", r.user.id).maybeSingle()).data : null;
        await sb.auth.signOut();
        sessionRef.current = null; setSession(null);
        if (!filed) return { ok: false, error: ce?.message ?? "Your account was created but the application could not be filed. Please sign in once to retry." };
        return { ok: true, confirmEmail: false };
      } catch {
        // Fall back to local creation
      }
    }

    // Local / Offline fallback doctor creation
    const newDoc: Doctor = {
      id: uid("d"),
      name: f.name.trim(),
      email,
      phone: f.phone.trim(),
      specialization: f.specialization,
      qualification: f.qualification.trim(),
      experience: f.experience,
      rating: 5.0,
      fee: f.fee,
      languages: f.languages.split(",").map((s) => s.trim()).filter(Boolean),
      bio: f.bio.trim(),
      password: f.password,
      slotMinutes: 30,
      availability: [
        { id: uid("w"), day: "Mon", start: "09:00", end: "17:00" },
        { id: uid("w"), day: "Wed", start: "09:00", end: "17:00" },
        { id: uid("w"), day: "Fri", start: "09:00", end: "17:00" },
      ],
      reviews: [],
    };

    const nextData = {
      ...dataRef.current,
      doctors: [...dataRef.current.doctors, newDoc],
    };
    dataRef.current = nextData;
    setData(nextData);
    writeJSON(KEYS.data, nextData);

    return { ok: true, confirmEmail: false };
  };

  const reviewApplication: Ctx["reviewApplication"] = async (doctorId, decision) => {
    if (!sb) return { ok: false, error: "Available with the Supabase backend only." };
    const { error } = await sb.rpc("admin_review_doctor", { p_doctor_id: doctorId, p_decision: decision });
    if (error) return { ok: false, error: error.message };
    await reload();
    return { ok: true };
  };

  // ---------- admin: add a doctor directly (server-side Edge Function, never the service key in the browser) ----------
  const createDoctorAsAdmin: Ctx["createDoctorAsAdmin"] = async (f, photo) => {
    if (!sb) return { ok: false, error: "Available with the Supabase backend only." };
    let photoPath: string | null = null, photoUrl: string | null = null;
    if (photo) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return { ok: false, error: "Photo must be a JPG, PNG or WebP image." };
      if (photo.size > 2 * 1024 * 1024) return { ok: false, error: "Photo must be under 2 MB." };
      photoPath = `${crypto.randomUUID()}.${photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg"}`;
      const up = await sb.storage.from("doctor-photos").upload(photoPath, photo, { contentType: photo.type, upsert: false });
      if (up.error) return { ok: false, error: `Photo upload failed: ${up.error.message}` };
      photoUrl = sb.storage.from("doctor-photos").getPublicUrl(photoPath).data.publicUrl;
    }
    const { data: res, error } = await sb.functions.invoke("admin-create-doctor", { body: { ...f, photo: photoUrl } });
    if (error || res?.error) {
      if (photoPath) await sb.storage.from("doctor-photos").remove([photoPath]);
      let msg: string | undefined = res?.error ?? error?.message;
      const ctx = (error as unknown as { context?: { json?: () => Promise<{ error?: string }> } } | null)?.context;
      if (ctx?.json) { try { const j = await ctx.json(); if (j?.error) msg = j.error; } catch { /* keep msg */ } }
      return { ok: false, error: msg ?? "Could not create the doctor." };
    }
    await reload();
    return { ok: true };
  };

  // ---------- password recovery + e-mail change (Supabase Auth does the secure part) ----------
  const requestPasswordReset: Ctx["requestPasswordReset"] = async (email) => {
    if (!sb) return { ok: false, error: "Password recovery needs the Supabase backend." };
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${siteUrl()}/reset-password` });
    if (error) return { ok: false, error: /rate|seconds|too many/i.test(error.message) ? "Please wait a minute before requesting another e-mail." : error.message };
    return { ok: true };
  };

  const changeEmail: Ctx["changeEmail"] = async (newEmail) => {
    if (!sb) return { ok: false, error: "E-mail change needs the Supabase backend." };
    const e = newEmail.trim().toLowerCase();
    const { data: cur } = await sb.auth.getUser();
    if (!cur.user) return { ok: false, error: "You are not signed in." };
    if (cur.user.email?.toLowerCase() === e) return { ok: false, error: "That is already your e-mail address." };
    const { data: r, error } = await sb.auth.updateUser({ email: e }, { emailRedirectTo: `${siteUrl()}/email-confirmed` });
    if (error) return { ok: false, error: /already|registered|exists/i.test(error.message) ? "That e-mail address is already in use." : /rate|seconds|too many/i.test(error.message) ? "Please wait a minute before trying again." : error.message };
    const verificationSent = Boolean(r.user?.new_email);
    if (!verificationSent) { await sb.rpc("sync_my_email"); await reload(); } // Supabase project has e-mail confirmation off: change applied immediately
    return { ok: true, verificationSent };
  };

  const refreshSession: Ctx["refreshSession"] = async () => {
    if (!sb) return;
    const s = await fetchSession(sb);
    if (s) { sessionRef.current = s; setSession(s); await reload(); }
  };

  const setStatus: Ctx["setStatus"] = (id, status) => {
    const d = dataRef.current;
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return { ok: false, error: "Appointment not found." };
    if (OCCUPYING.includes(status) && d.appointments.some((x) => x.id !== id && x.doctorId === a.doctorId && x.date === a.date && x.time === a.time && OCCUPYING.includes(x.status)))
      return { ok: false, error: "That slot is already taken by another appointment." };
    commit((x) => ({ ...x, appointments: x.appointments.map((y) => (y.id === id ? { ...y, status } : y)) }));
    const doc = d.doctors.find((x) => x.id === a.doctorId);
    const titles: Partial<Record<AppointmentStatus, string>> = { approved: "Appointment approved", rejected: "Appointment rejected", completed: "Appointment completed", cancelled: "Appointment cancelled", pending: "Appointment set to pending" };
    notify({ role: "patient", userId: a.patientId, title: titles[status] || "Appointment updated", body: `${a.ref} with ${doc?.name ?? "your doctor"} on ${fmtDate(a.date)} is now ${status}.` });
    toast(status === "rejected" || status === "cancelled" ? "info" : "success", titles[status] || "Appointment updated", a.ref);

    if (status === "cancelled") {
      const offer = createSlotOfferOnCancellation({
        cancelledAppt: a,
        allAppts: d.appointments,
        doctors: d.doctors,
        patients: d.patients,
      });
      if (offer) {
        notify({
          role: "patient",
          userId: offer.patientId,
          title: "⚡ Earlier Appointment Slot Available!",
          body: `An earlier slot at ${fmtTime(offer.vacatedTime)} with ${doc?.name ?? "your doctor"} opened up! Tap to claim this slot.`,
        });
      }
    }

    return { ok: true };
  };

  const cancelAppointment: Ctx["cancelAppointment"] = (id) => {
    const d = dataRef.current;
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return { ok: false, error: "Appointment not found." };
    if (!["pending", "approved"].includes(a.status) || a.date < todayISO()) return { ok: false, error: "Only upcoming pending or approved appointments can be cancelled." };
    commit((x) => ({ ...x, appointments: x.appointments.map((y) => (y.id === id ? { ...y, status: "cancelled" } : y)) }));
    const p = d.patients.find((x) => x.id === a.patientId);
    notify({ role: "doctor", userId: a.doctorId, title: "Appointment cancelled", body: `${p?.name ?? "A patient"} cancelled ${a.ref} (${fmtDate(a.date)} ${fmtTime(a.time)}). The slot is free again.` });
    notify({ role: "admin", title: "Appointment cancelled", body: `${a.ref} was cancelled by the patient.` });
    toast("info", "Appointment cancelled", `${a.ref} - the slot is available again.`);

    // Fast-Track Standby Promotion: Offer vacated earlier slot to next in-line patient
    const offer = createSlotOfferOnCancellation({
      cancelledAppt: a,
      allAppts: d.appointments,
      doctors: d.doctors,
      patients: d.patients,
    });
    if (offer) {
      const doc = d.doctors.find((x) => x.id === a.doctorId);
      notify({
        role: "patient",
        userId: offer.patientId,
        title: "⚡ Earlier Appointment Slot Available!",
        body: `An earlier slot at ${fmtTime(offer.vacatedTime)} with ${doc?.name ?? "your doctor"} opened up due to a cancellation! Tap to claim this slot.`,
      });
      toast(
        "success",
        "Earlier Slot Fast-Track Alert",
        `Offered the vacated ${fmtTime(offer.vacatedTime)} slot to ${offer.patientName} (next in line)!`
      );
    }

    return { ok: true };
  };

  const claimEarlierSlot: Ctx["claimEarlierSlot"] = (offerId) => {
    const d = dataRef.current;
    const accepted = acceptOffer(offerId);
    if (!accepted) return { ok: false, error: "Slot offer not found or already claimed." };

    const targetAppt = d.appointments.find((x) => x.id === accepted.targetAppointmentId);
    if (!targetAppt) return { ok: false, error: "Appointment not found." };

    // Move appointment time to the vacated earlier time
    commit((x) => ({
      ...x,
      appointments: x.appointments.map((y) =>
        y.id === accepted.targetAppointmentId ? { ...y, time: accepted.vacatedTime } : y
      ),
    }));

    // Update Live Queue Token in localStorage if present
    try {
      const rawQueue = localStorage.getItem("medivance_live_queue_v1");
      if (rawQueue) {
        const tokens = JSON.parse(rawQueue);
        const updatedTokens = tokens.map((t: any) =>
          t.appointmentId === accepted.targetAppointmentId
            ? { ...t, time: accepted.vacatedTime }
            : t
        );
        localStorage.setItem("medivance_live_queue_v1", JSON.stringify(updatedTokens));
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("medivance_live_queue");
          bc.postMessage({ type: "QUEUE_UPDATE", tokens: updatedTokens });
          bc.close();
        }
      }
    } catch {}

    const doc = d.doctors.find((x) => x.id === accepted.doctorId);
    notify({
      role: "patient",
      userId: accepted.patientId,
      title: "Fast-Track Slot Confirmed! ⚡",
      body: `Your consultation with ${doc?.name ?? "your doctor"} on ${fmtDate(accepted.date)} has been moved up to ${fmtTime(accepted.vacatedTime)}.`,
    });
    notify({
      role: "doctor",
      userId: accepted.doctorId,
      title: "Patient Moved to Earlier Slot",
      body: `${accepted.patientName} accepted the vacated ${fmtTime(accepted.vacatedTime)} slot.`,
    });
    toast(
      "success",
      "Earlier Slot Confirmed! ⚡",
      `Your consultation has been moved to ${fmtTime(accepted.vacatedTime)}!`
    );
    return { ok: true };
  };

  const declineEarlierSlot: Ctx["declineEarlierSlot"] = (offerId) => {
    const d = dataRef.current;
    const { nextOffer } = declineOfferAndPromoteNext({
      offerId,
      allAppts: d.appointments,
      doctors: d.doctors,
      patients: d.patients,
    });

    if (nextOffer) {
      const doc = d.doctors.find((x) => x.id === nextOffer.doctorId);
      notify({
        role: "patient",
        userId: nextOffer.patientId,
        title: "⚡ Earlier Appointment Slot Available!",
        body: `An earlier slot at ${fmtTime(nextOffer.vacatedTime)} with ${doc?.name ?? "your doctor"} opened up! Check your dashboard to claim it.`,
      });
      toast(
        "info",
        "Slot Offered to Next Patient",
        `Passed the ${fmtTime(nextOffer.vacatedTime)} slot to ${nextOffer.patientName}.`
      );
    } else {
      toast("info", "Offer Declined", "You will keep your original scheduled appointment time.");
    }
  };

  const addReview: Ctx["addReview"] = (doctorId, r) => {
    const doc = dataRef.current.doctors.find((x) => x.id === doctorId);
    if (!doc) return { ok: false, error: "Doctor not found." };
    const text = r.text.trim();
    if (r.rating < 1 || r.rating > 5) return { ok: false, error: "Please choose a star rating." };
    if (text.length < 5) return { ok: false, error: "Please write a short review (at least 5 characters)." };
    commit((x) => ({
      ...x,
      doctors: x.doctors.map((d) => {
        if (d.id !== doctorId) return d;
        const n = Math.max(d.reviews.length, 1);
        const rating = Math.round(((d.rating * n + r.rating) / (n + 1)) * 10) / 10; // blends into the existing rating
        return { ...d, rating, reviews: [{ id: uid("rv"), author: r.author, rating: r.rating, text, date: todayISO() }, ...d.reviews] };
      }),
    }));
    toast("success", "Review posted", "Thank you for your feedback.");
    return { ok: true };
  };

  // ---------- doctors ----------
  const saveDoctor: Ctx["saveDoctor"] = (doc, isNew) => {
    const d = dataRef.current;
    if (d.doctors.some((x) => x.id !== doc.id && x.email.toLowerCase() === doc.email.toLowerCase())) return { ok: false, error: "Another doctor already uses this email." };
    commit((x) => ({ ...x, doctors: isNew ? [...x.doctors, doc] : x.doctors.map((y) => (y.id === doc.id ? doc : y)) }));
    if (isNew) notify({ role: "admin", title: "Doctor added", body: `${doc.name} (${doc.specialization}) joined the directory.` });
    return { ok: true };
  };
  const removeDoctor = (id: string) => {
    const d = dataRef.current;
    const affected = d.appointments.filter((a) => a.doctorId === id && ["pending", "approved"].includes(a.status));
    commit((x) => ({
      ...x,
      doctors: x.doctors.filter((y) => y.id !== id),
      appointments: x.appointments.map((a) => (a.doctorId === id && ["pending", "approved"].includes(a.status) ? { ...a, status: "cancelled" as const } : a)),
    }));
    affected.forEach((a) => notify({ role: "patient", userId: a.patientId, title: "Appointment cancelled", body: `${a.ref} was cancelled because the doctor is no longer available.` }));
    toast("success", "Doctor removed", affected.length ? `${affected.length} open appointment(s) were cancelled.` : undefined);
  };

  // ---------- patients ----------
  const savePatient: Ctx["savePatient"] = (p) => {
    if (dataRef.current.patients.some((x) => x.id !== p.id && x.email.toLowerCase() === p.email.toLowerCase())) return { ok: false, error: "Another patient already uses this email." };
    commit((x) => ({ ...x, patients: x.patients.map((y) => (y.id === p.id ? p : y)) }));
    return { ok: true };
  };
  const removePatient = (id: string) => {
    commit((x) => ({
      ...x,
      patients: x.patients.filter((y) => y.id !== id),
      appointments: x.appointments.map((a) => (a.patientId === id && ["pending", "approved"].includes(a.status) ? { ...a, status: "cancelled" as const } : a)),
    }));
    toast("success", "Patient record removed");
  };

  // ---------- specializations ----------
  const saveSpecialization: Ctx["saveSpecialization"] = (s, oldName) => {
    const d = dataRef.current;
    if (d.specializations.some((x) => x.id !== s.id && x.name.toLowerCase() === s.name.trim().toLowerCase())) return { ok: false, error: "This specialization already exists." };
    const exists = d.specializations.some((x) => x.id === s.id);
    commit((x) => ({
      ...x,
      specializations: exists ? x.specializations.map((y) => (y.id === s.id ? s : y)) : [...x.specializations, s],
      doctors: oldName && oldName !== s.name ? x.doctors.map((doc) => (doc.specialization === oldName ? { ...doc, specialization: s.name } : doc)) : x.doctors,
    }));
    return { ok: true };
  };
  const removeSpecialization: Ctx["removeSpecialization"] = (id) => {
    const d = dataRef.current;
    const s = d.specializations.find((x) => x.id === id);
    if (!s) return { ok: false, error: "Specialization not found." };
    if (d.doctors.some((x) => x.specialization === s.name)) return { ok: false, error: "Reassign or remove the doctors in this specialization first." };
    commit((x) => ({ ...x, specializations: x.specializations.filter((y) => y.id !== id) }));
    return { ok: true };
  };

  const updateSettings = (s: Partial<Settings>) => commit((x) => ({ ...x, settings: { ...x.settings, ...s } }));

  const markAllRead = () => {
    if (!session) return;
    commit((x) => ({ ...x, notifications: x.notifications.map((n) => (n.role === session.role && (!n.userId || n.userId === session.userId) ? { ...n, read: true } : n)) }));
  };
  const clearNotifications = () => {
    if (!session) return;
    commit((x) => ({ ...x, notifications: x.notifications.filter((n) => !(n.role === session.role && (!n.userId || n.userId === session.userId))) }));
  };
  const changePassword: Ctx["changePassword"] = (current, next) => {
    const sess = sessionRef.current ?? session;
    if (!sess) return { ok: false, error: "You are not signed in." };
    const d = dataRef.current;
    const email = sess.role === "admin" ? d.settings.adminEmail : (sess.role === "doctor" ? d.doctors : d.patients).find((x) => x.id === sess.userId)?.email ?? "";
    if (sb) {
      return (async (): Promise<Res> => {
        const { error: e1 } = await sb.auth.signInWithPassword({ email, password: current });
        if (e1) return { ok: false, error: "Current password is incorrect." };
        const { error: e2 } = await sb.auth.updateUser({ password: next });
        return e2 ? { ok: false, error: e2.message } : { ok: true };
      })();
    }
    if (sess.role === "admin") {
      if (current !== d.settings.adminPassword) return { ok: false, error: "Current password is incorrect." };
      updateSettings({ adminPassword: next });
    } else if (sess.role === "doctor") {
      const u = d.doctors.find((x) => x.id === sess.userId);
      if (!u || u.password !== current) return { ok: false, error: "Current password is incorrect." };
      saveDoctor({ ...u, password: next });
    } else {
      const u = d.patients.find((x) => x.id === sess.userId);
      if (!u || u.password !== current) return { ok: false, error: "Current password is incorrect." };
      savePatient({ ...u, password: next });
    }
    return { ok: true };
  };

  const resetData = () => {
    if (sb) { toast("info", "Not available with Supabase", "Run npm run seed:supabase to reload the demo data."); return; } const s = createSeed(); dataRef.current = s; setData(s); toast("success", "Demo data restored"); };

  const user = useMemo<CurrentUser | null>(() => {
    if (!session) return null;
    if (session.role === "admin") return { id: "admin1", name: data.settings.adminName, email: data.settings.adminEmail, phone: data.settings.adminPhone };
    const list = session.role === "doctor" ? [...data.doctors, ...data.applications] : data.patients;
    const u = list.find((x) => x.id === session.userId || ("email" in session && (session as any).email && x.email.toLowerCase() === (session as any).email.toLowerCase()));
    if (u) return { id: u.id, name: u.name, email: u.email, phone: u.phone, photo: (u as Doctor).photo };
    if (list.length > 0) {
      const fallback = list[0];
      return { id: fallback.id, name: fallback.name, email: fallback.email, phone: fallback.phone, photo: (fallback as Doctor).photo };
    }
    return { id: session.userId, name: "Member", email: "", phone: "" };
  }, [session, data]);

  const value: Ctx = {
    ready, theme, toggleTheme, data, session, user, login, logout, registerPatient, changePassword, doctorById, patientById, getSlots, bookAppointment,
    bookPaidAppointment, bookGuestAppointment, toggleAuraConsent, addPrescription, addMedicalRecord, rescheduleAppointment, registerDoctor, reviewApplication, createDoctorAsAdmin, requestPasswordReset, changeEmail, refreshSession,
    setStatus, cancelAppointment, claimEarlierSlot, declineEarlierSlot, addReview, saveDoctor, removeDoctor, savePatient, removePatient, saveSpecialization, removeSpecialization,
    updateSettings, notify, markAllRead, clearNotifications, resetData,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
