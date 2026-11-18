-- MEDIVANCE migration 002: appointment security (fixes "new row violates row-level security policy").
-- Additive/idempotent. RLS stays ON. No policy uses `with check (true)`.
--
-- ROOT CAUSE (found by reading the app + schema): the app saved changes with PostgREST UPSERT (INSERT ... ON CONFLICT DO UPDATE).
-- Postgres evaluates the SELECT policy on the proposed row for an upsert. A patient creating a notification for the doctor/admin
-- (or any row they are not allowed to read back) therefore fails with "new row violates row-level security policy".
-- Fix 1 (app): lib/supabase/sync.ts now uses plain INSERT for new rows and UPDATE for changed rows (no SELECT-policy side effect).
-- Fix 2 (this file): explicit, role-checked appointment policies + a guard trigger, and bookings go through book_appointment_paid() (003).

-- ---------- appointment policies ----------
drop policy if exists appt_read on public.appointments;
drop policy if exists appt_insert on public.appointments;
drop policy if exists appt_update on public.appointments;
drop policy if exists appt_delete on public.appointments;

-- READ: admin = all; patient = own; approved doctor = those assigned to them.
create policy appt_read on public.appointments for select using (
  public.is_admin()
  or (public.my_role() = 'patient' and patient_id = public.my_ref())
  or (public.my_role() = 'doctor'  and doctor_id  = public.my_ref())
);

-- INSERT: only the admin may insert rows directly. A patient creates an appointment ONLY through
-- public.book_appointment_paid() (migration 003), which runs as the signed-in patient's own identity
-- (my_ref()), re-checks slot + fee on the server and records the simulated payment in the same transaction.
-- So a patient can book for themselves, and nobody can book for another patient or skip payment.
create policy appt_insert on public.appointments for insert with check (public.is_admin());

-- UPDATE: admin; the patient on their own appointment; the approved doctor on appointments assigned to them.
-- What they may change is limited by appointments_guard below.
create policy appt_update on public.appointments for update
  using (
    public.is_admin()
    or (public.my_role() = 'patient' and patient_id = public.my_ref())
    or (public.my_role() = 'doctor'  and doctor_id  = public.my_ref())
  )
  with check (
    public.is_admin()
    or (public.my_role() = 'patient' and patient_id = public.my_ref())
    or (public.my_role() = 'doctor'  and doctor_id  = public.my_ref())
  );

create policy appt_delete on public.appointments for delete using (public.is_admin());

-- ---------- guard: who may change what ----------
create or replace function public.appointments_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_privileged() then return new; end if;   -- admin, dashboard, or MEDIVANCE's own definer functions
  if new.id <> old.id or new.patient_id <> old.patient_id or new.doctor_id <> old.doctor_id
     or new."date" <> old."date" or new."time" <> old."time" or new.reason <> old.reason then
    raise exception 'Appointment details can only be changed through the reschedule function.' using errcode = '42501';
  end if;
  if public.my_role() = 'patient' then
    if new.status is distinct from old.status and not (new.status = 'cancelled' and old.status in ('pending', 'approved')) then
      raise exception 'Patients can only cancel their own pending or approved appointments.' using errcode = '42501';
    end if;
    if new.notes is distinct from old.notes then
      raise exception 'Patients cannot edit doctor notes.' using errcode = '42501';
    end if;
  elsif public.my_role() = 'doctor' then
    if old.status = 'cancelled' and new.status is distinct from old.status then
      raise exception 'A cancelled appointment cannot be changed.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists appointments_guard_trg on public.appointments;
create trigger appointments_guard_trg before update on public.appointments for each row execute function public.appointments_guard();
