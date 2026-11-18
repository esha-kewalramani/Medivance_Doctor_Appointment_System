import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both Supabase variables are set in .env.local. Otherwise the site runs on its built-in demo data. */
export const isSupabaseConfigured = Boolean(url && key);

/** Public address used in e-mail links (password reset, e-mail change). Set NEXT_PUBLIC_SITE_URL in production; falls back to the current origin. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

// supabase-js reads and then removes ?code=... / #access_token=... (or #error=...) from the address bar when the client starts.
// We keep a copy of what the page was opened with so the reset-password page can tell a valid recovery link from an expired one.
let initialUrl = { hash: "", search: "" };
export const getInitialAuthUrl = () => initialUrl;

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    if (typeof window !== "undefined") initialUrl = { hash: window.location.hash, search: window.location.search };
    client = createClient(url as string, key as string, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return client;
}
