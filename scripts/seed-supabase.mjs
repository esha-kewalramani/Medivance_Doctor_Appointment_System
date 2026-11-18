// Loads the MEDIVANCE demo data into your Supabase project and creates the demo logins.
// Run AFTER supabase/schema.sql:   npm run seed:supabase
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard -> Project Settings -> API -> service_role). Never put it in the website code.
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { rows, users } = JSON.parse(fs.readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"));

async function put(table, list) {
  if (!list.length) return;
  const { error } = await sb.from(table).upsert(list);
  if (error) { console.error(`x ${table}: ${error.message}`); process.exit(1); }
  console.log(`ok ${table}: ${list.length} rows`);
}

for (const t of ["specializations", "doctors", "patients", "availability", "reviews", "appointments", "notifications", "settings"]) await put(t, rows[t]);
// the reviews trigger blends ratings, so write the original ratings back
await put("doctors", rows.doctors);

// existing logins (so the script can be re-run safely)
const existing = new Map();
const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
(list.data?.users ?? []).forEach((x) => existing.set((x.email || "").toLowerCase(), x.id));

for (const u of users) {
  let id = existing.get(u.email);
  if (!id) {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email, password: u.password, email_confirm: true,
      app_metadata: { role: u.role }, user_metadata: { name: u.name },
    });
    if (error) { console.error(`x login ${u.email}: ${error.message} (status ${error.status ?? "?"}, code ${error.code ?? "?"})`); continue; }
    id = data.user.id;
  }
  const { error: e2 } = await sb.rpc("link_profile", { uid: id });
  if (e2) console.error(`x profile ${u.email}: ${e2.message}`);
  else console.log(`ok login ${u.role}: ${u.email}`);
}
console.log("\nDone. Demo passwords: Admin@123, Doctor@123, Patient@123 (see the Login page 'Use demo account' button).");
