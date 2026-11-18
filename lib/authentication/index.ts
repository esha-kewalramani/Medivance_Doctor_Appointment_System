import { DataState, Role, Session } from "@/types";

// FRONTEND SIMULATION ONLY: passwords live in LocalStorage and are compared in the browser.
// This is NOT secure. In the Supabase phase, replace with supabase.auth.signInWithPassword().
export function authenticate(role: Role, email: string, password: string, data: DataState): { ok: true; session: Session } | { ok: false; error: string } {
  const e = email.trim().toLowerCase();
  if (role === "admin") {
    const s = data.settings;
    if (e === s.adminEmail.toLowerCase() && password === s.adminPassword) return { ok: true, session: { role, userId: "admin1" } };
    return { ok: false, error: "Incorrect admin email or password." };
  }
  const list = role === "doctor" ? data.doctors : data.patients;
  const u = list.find((x) => x.email.toLowerCase() === e);
  if (!u) return { ok: false, error: `No ${role} account found with this email.` };
  if (u.password !== password) return { ok: false, error: "Incorrect password. Please try again." };
  return { ok: true, session: { role, userId: u.id } };
}
