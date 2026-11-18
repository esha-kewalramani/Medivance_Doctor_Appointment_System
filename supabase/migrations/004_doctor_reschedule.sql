-- MEDIVANCE migration 004: doctor-initiated rescheduling with full history. Additive/idempotent.
-- Payments are NOT touched: the same appointment row (and its payment / transaction ID) is kept, so a PAID appointment stays PAID.

create table if not exists public.appointment_reschedules (
  id text primary key default ('rs_' || replace(gen_random_uuid()::text, '-', '')),
  appointment_id text not null references public.appointments(id) on delete cascade,
  doctor_id text not null,
  old_date text not null, old_time text not null,
  new_date text not null, new_time text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists appt_resched_appt_idx on public.appointment_reschedules (appointment_id);

alter table public.appointment_reschedules enable row level security;
drop policy if exists definer_all on public.appointment_reschedules;
create policy definer_all on public.appointment_reschedules for all to postgres using (true) with check (true);
drop policy if exists resched_read on public.appointment_reschedules;
create policy resched_read on public.appointment_reschedules for select using (
  public.is_admin()
  or (public.my_role() = 'doctor' and doctor_id = public.my_ref())
  or (public.my_role() = 'patient' and exists (select 1 from public.appointments a where a.id = appointment_id and a.patient_id = public.my_ref()))
);
revoke insert, update, delete on public.appointment_reschedules from anon, authenticated;

create or replace function public.reschedule_appointment(p_appointment_id text, p_new_date text, p_new_time text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_doc text := public.my_ref();
  a record; v_reason text := left(btrim(coalesce(p_reason, '')), 500); v_pname text; v_dname text; v_hist text;
begin
  if auth.uid() is null or public.my_role() is distinct from 'doctor' then
    raise exception 'Only an approved doctor can reschedule appointments.' using errcode = '42501';
  end if;
  select * into a from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'Appointment not found.'; end if;
  if a.doctor_id is distinct from v_doc then
    raise exception 'You can only reschedule appointments assigned to you.' using errcode = '42501';
  end if;
  if a.status = 'cancelled' then raise exception 'Cancelled appointments cannot be rescheduled.'; end if;
  if a.status not in ('pending', 'approved') then
    raise exception 'Only pending or approved appointments can be rescheduled (this one is %).', a.status;
  end if;
  if a."date" = p_new_date and a."time" = p_new_time then raise exception 'Please choose a different date or time.'; end if;

  perform public.assert_valid_slot(a.doctor_id, p_new_date, p_new_time);          -- inside the doctor's availability, not in the past

  perform pg_advisory_xact_lock(hashtext('medivance:doctor:' || a.doctor_id));    -- same lock as booking: no race with a patient booking
  if exists (select 1 from public.appointments x where x.doctor_id = a.doctor_id and x."date" = p_new_date and x."time" = p_new_time
             and x.id <> a.id and x.status in ('pending', 'approved', 'completed')) then
    raise exception 'SLOT_TAKEN: That time already has another appointment. Please choose a free slot.' using errcode = '23505';
  end if;
  if exists (select 1 from public.appointments x where x.patient_id = a.patient_id and x."date" = p_new_date and x."time" = p_new_time
             and x.id <> a.id and x.status in ('pending', 'approved')) then
    raise exception 'The patient already has another appointment at that time. Please choose a different slot.' using errcode = '23505';
  end if;

  perform set_config('medivance.bypass_guard', '1', true);
  begin
    update public.appointments set "date" = p_new_date, "time" = p_new_time where id = a.id;
  exception when unique_violation then
    raise exception 'SLOT_TAKEN: That time was just taken. Please choose a free slot.' using errcode = '23505';
  end;

  insert into public.appointment_reschedules(appointment_id, doctor_id, old_date, old_time, new_date, new_time, reason)
  values (a.id, a.doctor_id, a."date", a."time", p_new_date, p_new_time, v_reason);

  select name into v_pname from public.patients where id = a.patient_id;
  select name into v_dname from public.doctors where id = a.doctor_id;
  v_hist := to_char(p_new_date::date, 'DD Mon YYYY') || ' at ' || to_char(p_new_time::time, 'HH12:MI AM');
  insert into public.notifications(id, role, user_ref, title, body) values
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'patient', a.patient_id, 'Appointment rescheduled',
       coalesce(v_dname, 'Your doctor') || ' moved ' || a.ref || ' from ' || to_char(a."date"::date, 'DD Mon YYYY') || ' at ' || to_char(a."time"::time, 'HH12:MI AM')
       || ' to ' || v_hist || '.' || case when v_reason <> '' then ' Reason: ' || v_reason else '' end || ' Your payment is unchanged.'),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'admin', null, 'Appointment rescheduled',
       coalesce(v_dname, 'A doctor') || ' rescheduled ' || a.ref || ' (' || coalesce(v_pname, 'patient') || ') to ' || v_hist || '.');

  return jsonb_build_object('appointment_id', a.id, 'ref', a.ref, 'date', p_new_date, 'time', p_new_time, 'reason', v_reason);
end $$;
revoke all on function public.reschedule_appointment(text, text, text, text) from public, anon;
grant execute on function public.reschedule_appointment(text, text, text, text) to authenticated;
