-- MEDIVANCE migration 005: AUTOMATED BOOKING CONFIRMATION FOR REGISTERED PATIENTS
-- Fully automated appointment booking system: when registered patients book an open slot,
-- it is immediately marked as 'approved' (no doctor approval gate required),
-- matching the guest booking workflow and showing up directly as approved on doctor dashboards.

create or replace function public.book_appointment_paid(
  p_doctor_id text,
  p_date text,
  p_time text,
  p_reason text,
  p_idempotency_key text
)
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
    -- AUTOMATED INSTANT APPROVAL (status: 'approved')
    insert into public.appointments(id, ref, patient_id, doctor_id, "date", "time", reason, status)
    values (v_appt_id, v_ref, v_patient, p_doctor_id, p_date, p_time, v_reason, 'approved');
    insert into public.payments(appointment_id, patient_id, doctor_id, amount, currency, status, method, transaction_id, idempotency_key)
    values (v_appt_id, v_patient, p_doctor_id, v_doc.fee, 'PKR', 'paid', 'DEMO / SIMULATED PAYMENT', v_tx, p_idempotency_key);
  exception when unique_violation then
    raise exception 'SLOT_TAKEN: Sorry, this slot was just booked by someone else. Please choose another time.' using errcode = '23505';
  end;

  insert into public.notifications(id, role, user_ref, title, body) values
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'doctor', p_doctor_id, 'New appointment confirmed',
       v_pat.name || ' confirmed for ' || to_char(p_date::date, 'DD Mon YYYY') || ' at ' || to_char(p_time::time, 'HH12:MI AM') || ' (' || v_ref || '). Slot booked and confirmed.'),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'admin', null, 'New booking confirmed', v_pat.name || ' booked ' || v_doc.name || ' - ' || v_ref || ' (simulated payment ' || v_tx || ').'),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'patient', v_patient, 'Appointment Confirmed',
       'Rs ' || v_doc.fee || ' for ' || v_doc.name || '. Transaction ' || v_tx || '. Your visit ' || v_ref || ' is confirmed.');

  return public.booking_json(v_appt_id) || jsonb_build_object('replayed', false);
end;
$$;
