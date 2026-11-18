# MEDIVANCE - AI-Powered Doctor Appointment System (Frontend phase)

Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + Recharts + SweetAlert2 + Lucide icons.
Data lives in **LocalStorage** (no backend, no API keys). Structured so Supabase can replace it later.

## Run
```bash
npm install
npm run dev      # http://localhost:3000
```

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Patient | patient@medivance.com | Patient@123 |
| Doctor | doctor@medivance.com | Doctor@123 |
| Admin | admin@medivance.com | Admin@123 |

The login pages also have a "Use demo account" helper. Passwords are stored in plain text in LocalStorage: this is a **frontend simulation only**, not secure authentication.

## Pages
Navbar: **Home, Inside, Doctors, Appointments, Aura AI, MyCare, Workspace** (+ Login, Book now).
- Home: hospital hero, ambiance gallery, departments, facilities, patient journey, then stats, doctors, FAQ, contact.
- Inside: the 15 facility panels with descriptions and a click-to-enlarge view.
- Aura AI: simulated AI assistant (`/aura-ai`). Workspace: role select (`/login`). MyCare: your dashboard.

## Splash
`public/splash/aura-splash.gif` plays full screen on every refresh (about 5.6 s, Skip button), then lands on the home page.

## Themes
Dark = Aura AI look (deep blue glass). Light = hospital look (white and teal, serif headings). The toggle cross-fades the whole site (View Transitions API, with a fallback). All colours are CSS variables in `app/globals.css`; dark-theme glow is intentionally subtle.

## Replacing assets
- Facility images: `public/facilities/01.jpg` ... `15.jpg` (small concept images; swap for bigger originals if you have them)
- Hero: `public/images/hero-night.jpg`, Aura AI visual: `public/images/aura-doctor.jpg`

## Backend: Supabase (real database + login)

The site runs in two modes:
- **Demo mode** (no keys in `.env.local`): data is in LocalStorage, as before.
- **Supabase mode** (both `NEXT_PUBLIC_SUPABASE_*` variables set): real login (Supabase Auth), real database, Row Level Security.

### One-time setup (about 10 minutes)
1. `npm install`
2. Supabase Dashboard -> **SQL Editor** -> New query -> paste all of `supabase/schema.sql` -> **Run** (click "Run query" if it warns about destructive operations: it only recreates the MEDIVANCE tables). Creates the tables, the no-double-booking rule and the security policies.
3. Dashboard -> **Authentication -> Sign In / Providers -> Email**: turn **"Confirm email" OFF** (otherwise new patients must click an email link before they can sign in).
4. Dashboard -> **Project Settings -> API** -> copy the **service_role** key into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...` (this key is only used by the seed script on your computer; never share it or prefix it with NEXT_PUBLIC).
5. `npm run seed:supabase` -> loads the 12 doctors, 10 patients, appointments, reviews and creates the demo logins.
6. `npm run dev` (or `npm run build` then `npm start`). Log in with the demo accounts: `Admin@123`, `Doctor@123`, `Patient@123` (use the "Use demo account" button on each login page).

### How it is protected
- Passwords are handled only by Supabase Auth (hashed). The browser never sees other people's passwords.
- Public sign-up can only create a **patient**. Doctor and admin roles can only be assigned with the service-role key (the seed script / Dashboard).
- Row Level Security: a patient sees only their own appointments and profile; a doctor sees their own appointments and the patients booked with them; the admin sees everything. Even if someone edits the frontend, the database refuses.
- **No double-booking** is enforced by the database itself (unique index on doctor + date + time for active appointments).

### Adding a doctor from the Admin portal
Saving a doctor creates the doctor record. To let that doctor log in, create a login in Dashboard -> Authentication -> Add user with the **same email**, and set app metadata `{"role":"doctor"}` (or use the seed script pattern). It links to the doctor record automatically.

### Deploy on Vercel
Import the repo, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Project Settings -> Environment Variables, deploy. Do not add the service-role key to Vercel.

### Final upgrade (payments, doctor approval, rescheduling, recovery)
See `UPGRADE_GUIDE.md` (migrations 001-005, Edge Function, e-mail settings) and `TESTING_STATUS.md` (what is and is not tested).

### Not included yet
Video-call provider, real AI provider, real payment gateway (payments are simulated), patient medical-record tables. (Aura AI and video are still simulated, and labelled as such.)
