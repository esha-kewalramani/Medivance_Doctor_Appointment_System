-- MEDIVANCE migration 004: GUEST DIRECT BOOKING (Instant confirmation without login)
-- Allows a guest patient to book an available slot directly.
-- Automatically creates/links the patient profile, marks appointment as 'approved',
-- records the simulated payment, notifies the doctor, and prevents double-booking.

create or replace function public.book_appointment_guest(
  p_doctor_id text,
  p_date text,
  p_time text,
  p_reason text,
  p_name text,
  p_email text,
  p_phone text,
  p_gender text default 'Other',
  p_age text default null,
  p_idempotency_key text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pat_id text;
  v_doc record; v_old record;
  v_appt_id text; v_ref text; v_tx text;
  v_reason text := btrim(coalesce(p_reason, 'General Medical Consultation'));
  v_name text := btrim(coalesce(p_name, 'Direct Guest Patient'));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_gender text := coalesce(nullif(btrim(p_gender), ''), 'Other');
  v_dob text := case when p_age ~ '^[0-9]{1,3}$' then ((extract(year from current_date) - p_age::int)::text || '-01-01') else '2000-01-01' end;
  v_try int := 0;
begin
  if length(v_email) < 5 or v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'A valid email address is required for direct booking.';
  end if;

  select * into v_doc from public.doctors where id = p_doctor_id and approval_status = 'approved';
  if not found then raise exception 'This doctor is not available for booking.'; end if;
  perform public.assert_valid_slot(p_doctor_id, p_date, p_time);

  -- 1. Serialise concurrent bookings of the same doctor to avoid double booking
  perform pg_advisory_xact_lock(hashtext('medivance:doctor:' || p_doctor_id));
  if exists (select 1 from public.appointments where doctor_id = p_doctor_id and "date" = p_date and "time" = p_time
             and status in ('pending', 'approved', 'completed')) then
    raise exception 'SLOT_TAKEN: Sorry, this slot was just booked by someone else. Please choose another time.' using errcode = '23505';
  end if;

  -- 2. Idempotency check if key provided
  if p_idempotency_key is not null and length(btrim(p_idempotency_key)) >= 8 then
    select p.appointment_id into v_old from public.payments p where p.idempotency_key = p_idempotency_key;
    if found then
      return public.booking_json(v_old.appointment_id) || jsonb_build_object('replayed', true);
    end if;
  end if;

  -- 3. Upsert / find patient by email
  select id into v_pat_id from public.patients where lower(email) = v_email;
  if v_pat_id is null then
    v_pat_id := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    insert into public.patients(id, name, email, phone, gender, dob)
    values (v_pat_id, v_name, v_email, v_phone, v_gender, v_dob);
  else
    -- update contact phone if provided
    if length(v_phone) > 4 then
      update public.patients set phone = v_phone where id = v_pat_id;
    end if;
  end if;

  -- 4. Generate unique reference and IDs
  loop
    v_ref := 'MDV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    exit when not exists (select 1 from public.appointments where ref = v_ref);
    v_try := v_try + 1; if v_try > 5 then raise exception 'Could not allocate a reference. Please try again.'; end if;
  end loop;
  v_appt_id := 'a' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_tx := 'SIM-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  -- 5. Insert directly as APPROVED so doctor dashboard immediately shows it booked
  begin
    insert into public.appointments(id, ref, patient_id, doctor_id, "date", "time", reason, status, notes)
    values (v_appt_id, v_ref, v_pat_id, p_doctor_id, p_date, p_time, v_reason, 'approved', 'Direct Guest Booking: ' || v_name || ' (' || v_phone || ')');

    insert into public.payments(appointment_id, patient_id, doctor_id, amount, currency, status, method, transaction_id, idempotency_key)
    values (v_appt_id, v_pat_id, p_doctor_id, v_doc.fee, 'PKR', 'paid', 'DEMO / SIMULATED PAYMENT (GUEST)', v_tx, p_idempotency_key);
  exception when unique_violation then
    raise exception 'SLOT_TAKEN: Sorry, this slot was just booked by someone else. Please choose another time.' using errcode = '23505';
  end;

  -- 6. Notify Doctor & Admin
  insert into public.notifications(id, role, user_ref, title, body) values
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'doctor', p_doctor_id, 'New Appointment Confirmed',
       v_name || ' booked and confirmed for ' || to_char(p_date::date, 'DD Mon YYYY') || ' at ' || to_char(p_time::time, 'HH12:MI AM') || ' (' || v_ref || '). Contact: ' || v_phone),
    ('n' || replace(gen_random_uuid()::text, '-', ''), 'admin', null, 'New Guest Booking Confirmed',
       v_name || ' booked ' || v_doc.name || ' - ' || v_ref || ' (Direct Booking).');

  return public.booking_json(v_appt_id) || jsonb_build_object('replayed', false);
end $$;

revoke all on function public.book_appointment_guest(text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.book_appointment_guest(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
