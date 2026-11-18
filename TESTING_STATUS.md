# MEDIVANCE - testing status (honest)

## Verified in my environment
- TypeScript type-check of all new/changed files: no type errors in them (run with stub typings because the sandbox had no network, so `npm install` and `next build` could NOT be run).
- Careful code review of every SQL file and the Edge Function.

## NOT executed here (no Postgres, no Supabase, no Deno, no browser available)
Nothing below has been run. Treat all of it as untested until you tick it off:
1. All five SQL migrations and the diagnostics.
2. `supabase/tests/rls_and_rpc_tests.sql` (automated PASS/FAIL for booking, duplicate payment, blocked direct inserts, other-patient isolation, reschedule + payment stays PAID, cancelled can't reschedule, pending doctor sees nothing, no self-approval).
3. The Edge Function `admin-create-doctor`.
4. The UI flows, the real e-mails, and `npm run build`.

## Your checklist (after migrations + function deploy)
Run `npm install && npm run build` first, then:
- [ ] SQL self-test shows all PASS.
- [ ] Patient books: Review -> Continue to payment -> Pay Now (spinner) -> success with SIM- transaction ID; double-click Pay Now creates one booking; existing receipt shows fee, PAID, transaction ID, date, DEMO method.
- [ ] Booking no longer shows the RLS error; cancelling an appointment (notifies doctor/admin) also works.
- [ ] Doctor login page -> Create Account as a Doctor -> admin sees application -> pending doctor sees pending screen -> admin approves -> doctor opens dashboard; rejected doctor sees the rejected screen. Existing doctors still log in.
- [ ] Admin -> Doctors -> Add New Doctor (photo, hours) -> doctor can log in immediately; duplicate email is refused.
- [ ] Forgot Password on patient/doctor/admin login -> e-mail -> /reset-password -> new password -> sign in; reuse the link / wait for expiry -> "link not valid".
- [ ] Profile -> Change email -> verification mail (see guide section 4) -> after verifying, profile shows the new address, role unchanged.
- [ ] Doctor -> Appointments -> Reschedule: conflicting slot refused, patient sees new time + notification, receipt/transaction unchanged, history listed; cancelled appointment has no Reschedule button.
- [ ] AURA AI, Emergency Assistant, other pages unchanged.
