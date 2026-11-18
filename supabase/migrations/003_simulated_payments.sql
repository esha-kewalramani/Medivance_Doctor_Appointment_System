-- MEDIVANCE migration 003: SIMULATED consultation-fee payments + atomic "pay then book".
-- No real gateway, no card data, no money moves. Additive/idempotent.

create table if not exists public.payments (
  id text primary key default ('pay_' || replace(gen_random_uuid()::text, '-', '')),
  appointment_id text not null unique references public.appointments(id) on delete cascade,  -- one payment per appointment => no duplicate charge
  patient_id text not null,
  doctor_id text not null,
  amount int not null check (amount >= 0),
  currency text not null default 'PKR',
  status text not null default 'paid' check (status in ('paid', 'failed', 'cancelled')),
  method text not null default 'DEMO / SIMULATED PAYMENT',
  transaction_id text not null unique,
  idempotency_key text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists payments_idem_idx on public.payments (patient_id, idempotency_key) where idempotency_key is not null;
create index if not exists payments_patient_idx on public.payments (patient_id);
create index if not exists payments_doctor_idx on public.payments (doctor_id);

alter table public.payments enable row level security;
drop policy if exists definer_all on public.payments;
create policy definer_all on public.payments for all to postgres using (true) with check (true);
drop policy if exists pay_read on public.payments;
create policy pay_read on public.payments for select using (
  public.is_admin()
  or (public.my_role() = 'patient' and patient_id = public.my_ref())
  or (public.my_role() = 'doctor'  and doctor_id  = public.my_ref())
);
-- No insert/update/delete policies: browsers can never write a payment. Only book_appointment_paid() can.
revoke insert, update, delete on public.payments from anon, authenticated;

-- ---------- slot validation (same rules as the website's slot picker) ----------
-- Times are interpreted in Pakistan time, like the website.
create or replace function public.assert_valid_slot(p_doctor_id text, p_date text, p_time text) returns void
language plpgsql stable security definer set search_path = public as $$
declare
  d date; tm int; dow text; step int; ok boolean; now_local timestamp := (now() at time zone 'Asia/Karachi');
begin
  if p_date is null or p_time is null or p_date !~ '^\d{4}-\d{2}-\d{2}$' or p_time !~ '^\d{2}:\d{2}$' then
    raise exception 'Invalid date or time.';
  end if;
  begin d := p_date::date; exception when others then raise exception 'Invalid date.'; end;
  tm := split_part(p_time, ':', 1)::int * 60 + split_part(p_time, ':', 2)::int;
  select slot_minutes into step from public.doctors where id = p_doctor_id;
  if step is null or step < 5 then raise exception 'Doctor not found.'; end if;
  dow := to_char(d, 'Dy');
  select exists (
    select 1 from public.availability a
    where a.doctor_id = p_doctor_id and a.day = dow
      and tm >= split_part(a.start_time, ':', 1)::int * 60 + split_part(a.start_time, ':', 2)::int
      and tm + step <= split_part(a.end_time, ':', 1)::int * 60 + split_part(a.end_time, ':', 2)::int
      and (tm - (split_part(a.start_time, ':', 1)::int * 60 + split_part(a.start_time, ':', 2)::int)) % step = 0
  ) into ok;
  if not ok then raise exception 'This time is not part of the doctor''s schedule.'; end if;
  if d < now_local::date or (d = now_local::date and tm <= extract(hour from now_local)::int * 60 + extract(minute from now_local)::int) then
    raise exception 'This time has already passed.';
  end if;
end $$;
revoke all on function public.assert_valid_slot(text, text, text) from public, anon, authenticated;

create or replace function public.booking_json(p_appointment_id text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'appointment', jsonb_build_object('id', a.id, 'ref', a.ref, 'patient_id', a.patient_id, 'doctor_id', a.doctor_id, 'date', a."date",
                                      'time', a."time", 'reason', a.reason, 'status', a.status, 'created_at', a.created_at),
    'payment', case when p.id is null then null else jsonb_build_object('id', p.id, 'appointment_id', p.appointment_id, 'patient_id', p.patient_id,
                 'doctor_id', p.doctor_id, 'amount', p.amount, 'currency', p.currency, 'status', p.status, 'method', p.method,
                 'transaction_id', p.transaction_id, 'paid_at', p.paid_at) end)
  from public.appointments a left join public.payments p on p.appointment_id = a.id where a.id = p_appointment_id
$$;
revoke all on function public.booking_json(text) from public, anon, authenticated;

-- ---------- atomic simulated payment + booking ----------
-- The browser only sends doctor, date, time, reason and a one-time key. The FEE is read from public.doctors here,
-- the patient is taken from the login (my_ref()), and appointment + payment are created in ONE transaction:
-- if anything fails, nothing is saved (no appointment without payment, no payment without appointment).
create or replace function public.book_appointment_paid(p_doctor_id text, p_date text, p_time text, p_reason text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_patient text := public.my_ref();
  v_pat record; v_doc record; v_old record;
  v_appt_id text; v_ref text; v_tx text; v_reason text := btrim(coalesce(p_reason, ''));
  v_try int := 0;
begin
  if auth.uid() is null or public.my_role() is distinct from 'patient' then
    raise exception 'Only a signed-in patient can book appointments.' using errcode = '42501';
  end if;
  select * into v_pat from public.patients where id = v_patient;
  if not found then raise exception 'Your patient profile was not found.' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_idempotency_key, ''))) < 8 then raise exception 'Missing payment reference. Please try again.'; end if;

  -- repeated click / retry with the same key => return the original booking, never a second payment
  select p.appointment_id into v_old from public.payments p where p.patient_id = v_patient and p.idempotency_key = p_idempotency_key;
  if found then
    return public.booking_json(v_old.appointment_id) || jsonb_build_object('replayed', true);
  end if;

  if length(v_reason) < 5 then raise exception 'Please enter a reason for the visit (at least 5 characters).'; end if;
  select * into v_doc from public.doctors where id = p_doctor_id and approval_status = 'approved';
  if not found then raise exception 'This doctor is not available for booking.'; end if;
  perform public.assert_valid_slot(p_doctor_id, p_date, p_time);

  -- serialise concurrent bookings of the same doctor, then re-check the slot
  perform pg_advisory_xact_lock(hashtext('medivance:doctor:' || p_doctor_id));
  if exists (select 1 from public.appointments where doctor_id = p_doctor_id and "date" = p_date and "time" = p_time
             and status in ('pending', 'approved', 'completed')) then
    raise exception 'SLOT_TAKEN: Sorry, this slot was just booked by someone else. Please choose another time.' using errcode = '23505';
  end if;

  loop
    v_ref := 'MDV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    exit when not exists (select 1 from public.appointments where ref = v_ref);
    v_try := v_try + 1; if v_try > 5 then raise exception 'Could not allocate a reference. Please try again.'; end if;
  end loop;
  v_appt_id := 'a' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_tx := 'SIM-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  begin
    insert into public.appointments(id, ref, patient_id, doctor_id, "date", "time", reason, status)
    values (v_appt_id, v_ref, v_patient, p_doctor_id, p_date, p_time, v_reason, 'pending');
    insert into public.payments(appointment_id, patient_id, doctor_id, amount, currency, status, method, transaction_id, idempotency_key)
    values (v_appt_id, v_patient, p_doctor_id, v_doc.fee, 'PKR', 'paid', 'DEMO / SIMULATED PAYMENT', v_tx, p_idempotency_key);
  exception when unique_violation then
    raise exception 'SLOT_TAKEN: Sorry, this slot was just booked by someone else. Please choose another time.' using errcode = '23505';
  end;

  insert into public.notifications(id, role, user_ref, title, body) values
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'doctor', p_doctor_id, 'New appointment request',
       v_pat.name || ' requested ' || to_char(p_date::date, 'DD Mon YYYY') || ' at ' || to_char(p_time::time, 'HH12:MI AM') || ' (' || v_ref || '). Consultation fee paid (simulated).'),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'admin', null, 'New booking', v_pat.name || ' booked ' || v_doc.name || ' - ' || v_ref || ' (simulated payment ' || v_tx || ').'),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'patient', v_patient, 'Payment successful (simulated)',
       'Rs ' || v_doc.fee || ' for ' || v_doc.name || '. Transaction ' || v_tx || '. Your request ' || v_ref || ' is awaiting the doctor''s approval.');

  return public.booking_json(v_appt_id) || jsonb_build_object('replayed', false);
end $$;
revoke all on function public.book_appointment_paid(text, text, text, text, text) from public, anon;
grant execute on function public.book_appointment_paid(text, text, text, text, text) to authenticated;
