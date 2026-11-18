// Thin LocalStorage wrapper. Replace the bodies with Supabase calls in the backend phase.
export const KEYS = { data: "mdv:data:v1", theme: "mdv:theme", session: "mdv:session" } as const;

export function readJSON<T>(key: string, store: "local" | "session" = "local"): T | null {
  try {
    const s = store === "local" ? window.localStorage : window.sessionStorage;
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
export function writeJSON(key: string, value: unknown, store: "local" | "session" = "local") {
  try { (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* quota or private mode */ }
}
export function removeKey(key: string, store: "local" | "session" = "local") {
  try { (store === "local" ? window.localStorage : window.sessionStorage).removeItem(key); } catch { /* ignore */ }
}
