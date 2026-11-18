-- MEDIVANCE backend self-test. Run in Supabase SQL Editor AFTER migrations 001-005 and the seed.
-- Everything runs inside ONE transaction that is ROLLED BACK at the end: no data is kept.
-- Needs: >= 2 patient logins, >= 1 approved doctor login with availability (the seed script provides them).
-- The last statement shows a PASS/FAIL table. (Written for you to run; it has not been executed by the author.)
begin;
create temp table t_results(n serial primary key, test text, result text);
grant all on t_results to authenticated; grant usage, select on sequence t_results_n_seq to authenticated;
create function pg_temp.rec(t text, ok boolean) returns void language sql as $f$ insert into t_results(test, result) values (t, case when ok then 'PASS' else 'FAIL' end) $f$;

do $$
declare
  v_doc text; v_docuser uuid; v_fee int; v_day text; v_tm text; v_dt text; v_dt2 text;
  v_p1 uuid; v_p1id text; v_p2 uuid; v_p2id text;
  r jsonb; r2 jsonb; v_appt text; v_tx text; n int; failed boolean;
begin
  select d.id, pr.user_id, d.fee, a.day, a.start_time into v_doc, v_docuser, v_fee, v_day, v_tm
    from public.doctors d join public.profiles pr on pr.ref_id = d.id and pr.role = 'doctor'
    join public.availability a on a.doctor_id = d.id where d.approval_status = 'approved' order by d.id limit 1;
  select (current_date + g)::text into v_dt from generate_series(2, 21) g where to_char(current_date + g, 'Dy') = v_day order by g limit 1;
  v_dt2 := (v_dt::date + 7)::text;
  select user_id, ref_id into v_p1, v_p1id from public.profiles where role = 'patient' order by user_id limit 1;
  select user_id, ref_id into v_p2, v_p2id from public.profiles where role = 'patient' order by user_id offset 1 limit 1;

  -- 1. patient books + pays (fee comes from the doctors table)
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.book_appointment_paid(v_doc, v_dt, v_tm, 'Self-test routine checkup', 'selftest-key-0001');
  v_appt := r->'appointment'->>'id'; v_tx := r->'payment'->>'transaction_id';
  perform pg_temp.rec('patient can book via book_appointment_paid (RLS error gone)', v_appt is not null);
  perform pg_temp.rec('payment amount equals the doctor''s stored fee, status PAID', (r->'payment'->>'amount')::int = v_fee and r->'payment'->>'status' = 'paid');
  perform pg_temp.rec('transaction id is marked simulated', v_tx like 'SIM-%' and r->'payment'->>'method' = 'DEMO / SIMULATED PAYMENT');

  -- 2. repeated click with the same key => same booking, no second payment
  r2 := public.book_appointment_paid(v_doc, v_dt, v_tm, 'Self-test routine checkup', 'selftest-key-0001');
  perform pg_temp.rec('duplicate payment prevented (same key replays original)', (r2->>'replayed')::boolean and r2->'payment'->>'transaction_id' = v_tx);

  -- 3. direct inserts are refused
  failed := false; begin insert into public.appointments(id, ref, patient_id, doctor_id, "date", "time", reason) values ('selftest1', 'MDV-SELF1', v_p1id, v_doc, v_dt2, v_tm, 'direct insert'); exception when others then failed := true; end;
  perform pg_temp.rec('direct appointment INSERT by patient is blocked (must pay first)', failed);
  failed := false; begin insert into public.appointments(id, ref, patient_id, doctor_id, "date", "time", reason) values ('selftest2', 'MDV-SELF2', v_p2id, v_doc, v_dt2, v_tm, 'for someone else'); exception when others then failed := true; end;
  perform pg_temp.rec('patient cannot create an appointment for another patient', failed);

  -- 4. patient cannot move or edit their appointment
  failed := false; begin update public.appointments set "date" = v_dt2 where id = v_appt; exception when others then failed := true; end;
  perform pg_temp.rec('patient cannot change appointment date directly', failed);

  -- 5. another patient cannot see it
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2, 'role', 'authenticated')::text, true);
  select count(*) into n from public.appointments where id = v_appt;
  perform pg_temp.rec('other patient cannot read the appointment', n = 0);
  select count(*) into n from public.payments where appointment_id = v_appt;
  perform pg_temp.rec('other patient cannot read the payment', n = 0);

  -- 6. doctor reschedules: payment untouched, history stored
  perform set_config('request.jwt.claims', json_build_object('sub', v_docuser, 'role', 'authenticated')::text, true);
  perform public.reschedule_appointment(v_appt, v_dt2, v_tm, 'Self-test reschedule');
  execute 'reset role';
  select count(*) into n from public.appointment_reschedules where appointment_id = v_appt and new_date = v_dt2 and old_date = v_dt;
  perform pg_temp.rec('reschedule stored with old/new date, reason, doctor', n = 1);
  select count(*) into n from public.payments where appointment_id = v_appt and transaction_id = v_tx and status = 'paid';
  perform pg_temp.rec('payment still PAID with the original transaction id', n = 1);
  select count(*) into n from public.notifications where role = 'patient' and user_ref = v_p1id and title = 'Appointment rescheduled';
  perform pg_temp.rec('patient notified of the reschedule', n >= 1);

  -- 7. cancelled appointments cannot be rescheduled
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update public.appointments set status = 'cancelled' where id = v_appt;
  perform set_config('request.jwt.claims', json_build_object('sub', v_docuser, 'role', 'authenticated')::text, true);
  failed := false; begin perform public.reschedule_appointment(v_appt, v_dt, v_tm, 'should fail'); exception when others then failed := true; end;
  perform pg_temp.rec('cancelled appointment cannot be rescheduled', failed);
  execute 'reset role';

  -- 8. unapproved doctor gets no doctor data
  update public.doctors set approval_status = 'pending' where id = v_doc;
  perform set_config('request.jwt.claims', json_build_object('sub', v_docuser, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.appointments;
  perform pg_temp.rec('pending doctor sees zero appointments (approval enforced by the database)', n = 0);
  failed := false; begin update public.doctors set approval_status = 'approved' where id = v_doc; if not found then failed := true; end if; exception when others then failed := true; end;
  perform pg_temp.rec('doctor cannot approve themselves', failed);
  execute 'reset role';
end $$;

select n, test, result from t_results order by n;
rollback;
