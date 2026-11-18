# MEDIVANCE - final upgrade guide

Everything below was added to your EXISTING project. No table is dropped, no row is deleted, RLS stays ON, no new Supabase project, AURA AI and the Emergency Assistant were not touched.
**Do NOT run `supabase/schema.sql`** on your live project (it is the original destructive baseline, now marked with a warning).

## 1. Apply the SQL migrations (in order)
Supabase Dashboard -> SQL Editor -> New query -> paste -> Run. Each file is idempotent (safe to re-run).

| File | What it does |
|---|---|
| `supabase/migrations/001_doctor_approval.sql` | `approval_status` on doctors (all existing doctors become `approved`), approval enforced in `my_role()`, doctor self-registration -> PENDING, `admin_review_doctor()` |
| `002_fix_appointment_rls.sql` | explicit role-checked appointment policies + guard trigger (the booking RLS fix, with the app change below) |
| `003_simulated_payments.sql` | `payments` table (read-only for browsers) and `book_appointment_paid()` (atomic pay + book, fee read server-side, idempotent) |
| `004_doctor_reschedule.sql` | `appointment_reschedules` history + `reschedule_appointment()` (availability, conflict, ownership, status checks) |
| `005_email_sync_and_photo_storage.sql` | `sync_my_email()` and the `doctor-photos` storage bucket (admin-only writes) |

Optional: `supabase/diagnostics/00_diagnose_booking_rls.sql` (read-only checks) and `supabase/tests/rls_and_rpc_tests.sql` (self-test, rolls back).

## 2. Deploy the Edge Function (admin "Add New Doctor")
Option A (CLI): `supabase login`, `supabase link --project-ref <ref>`, `supabase functions deploy admin-create-doctor`.
Option B (Dashboard): Edge Functions -> Create function `admin-create-doctor` -> paste `supabase/functions/admin-create-doctor/index.ts` -> Deploy. Leave "Verify JWT" ON.
No secret needs to be set: Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into the function. The service key is never in the website.

## 3. Environment variables
`.env.local` (and Vercel): keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. New, optional: `NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app` (no trailing slash). Never add the service-role key to Vercel or any `NEXT_PUBLIC_` variable.

## 4. Supabase Auth e-mail configuration
- Authentication -> URL Configuration: **Site URL** = your site. **Redirect URLs** add: `https://your-site/reset-password`, `https://your-site/email-confirmed`, and for local work `http://localhost:3000/reset-password`, `http://localhost:3000/email-confirmed`.
- Authentication -> Email Templates: "Reset Password" and "Change Email Address" must contain `{{ .ConfirmationURL }}` (default templates do).
- Built-in Supabase mail is heavily rate limited; for real use configure custom SMTP (Authentication -> SMTP).
- **Confirm email setting matters.** As far as I know, with "Confirm email" OFF Supabase applies an e-mail change immediately (no verification mail); to require verification, turn it ON (and consider "Secure email change"). The app handles both and tells the user which happened. With Confirm email ON, a doctor application is filed at the doctor's first sign-in after confirming (the database cannot see it earlier because no trigger on `auth.users` is used, as in your original design).

## 5. What changed in the app (files)
- `lib/supabase/sync.ts`: **root cause fix** - new rows are INSERTed and changed rows UPDATEd instead of UPSERTed. loads payments, reschedule history, doctor applications; session carries doctor approval.
- `components/AppProvider.tsx`: new actions (paid booking, reschedule, doctor registration/review, admin create doctor, password reset, change email).
- Booking: `BookingWizard.tsx` (new Payment step), existing `ReceiptModal.tsx` (adds fee paid, status PAID, transaction ID, payment date, method), `AppointmentCard.tsx` (PAID badge, reschedule note).
- Doctor: `RescheduleModal.tsx` + button in `app/doctor/appointments/page.tsx`; `ApprovalGate.tsx` in `PortalShell.tsx` for pending/rejected doctors.
- Admin: `DoctorApplications.tsx`, `AdminAddDoctorForm.tsx` in `app/admin/doctors/page.tsx`.
- Auth: `LoginForm.tsx` (Create Account as a Doctor, real Forgot Password), `/reset-password`, `/email-confirmed`, `ChangeEmailCard.tsx` on patient/doctor profile and admin settings.

## 6. Design decisions you should know
1. **Booking RLS error - diagnosis.** I could not connect to your live Supabase, so this comes from your code and `schema.sql`: the app saved with UPSERT; Postgres also applies the SELECT policy to the new row of an upsert, so cross-role rows (a patient's notification for the doctor/admin) were rejected with "new row violates row-level security policy". Run `00_diagnose_booking_rls.sql` to confirm on your project (step 3 there also catches a login without profile).
2. **Patients no longer INSERT appointments directly.** They book only through `book_appointment_paid()`, which uses the signed-in patient's own identity, so nobody can book for another patient or skip payment. Admin can still insert.
3. **Doctor approval step kept.** After payment the appointment is created `pending` and the doctor still approves/rejects it, exactly as before. "Confirmed" here means booked + paid.
4. **Cancelling a paid appointment** does not refund (simulated payments only); the payment row stays PAID.
5. Only paid bookings are recorded; a cancelled/failed payment simply creates nothing.
6. Existing appointments made before this upgrade show "NOT PAID - pay at the clinic" on the receipt.
7. Doctor email-existence pre-check (`doctor_email_taken`) reveals only whether an address is already a doctor record.
