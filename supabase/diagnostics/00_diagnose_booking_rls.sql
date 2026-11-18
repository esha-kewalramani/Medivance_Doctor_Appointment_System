-- READ-ONLY diagnostics for the booking error "new row violates row-level security policy".
-- Run each block in the SQL Editor and compare with what the migrations expect. Changes nothing.

-- 1) Which policies exist on the tables the booking touches?
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies where schemaname = 'public' and tablename in ('appointments', 'notifications', 'patients', 'profiles')
order by tablename, cmd, policyname;

-- 2) Is RLS on? (must be true for every row)
select relname as table_name, relrowsecurity as rls_on from pg_class
where relnamespace = 'public'::regnamespace and relname in ('appointments', 'notifications', 'patients', 'doctors', 'profiles', 'payments') order by 1;

-- 3) Does every login have a profile? (a login WITHOUT a profile makes my_ref() NULL, so every patient-owned INSERT fails)
select u.email, u.raw_app_meta_data ->> 'role' as app_role, p.role as profile_role, p.ref_id
from auth.users u left join public.profiles p on p.user_id = u.id order by u.email;

-- 4) Does each patient profile point at a real patients row, and is the id the same one the app sends as patient_id?
select p.user_id, p.ref_id, (select count(*) from public.patients x where x.id = p.ref_id) as patient_rows
from public.profiles p where p.role = 'patient';

-- 5) Simulate a booking AS a patient (replace the email). Rolls back, so nothing is saved.
begin;
  select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'patient@medivance.pk'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.my_role() as my_role, public.my_ref() as my_ref;                 -- both must be non-null
  -- the OLD app code UPSERTED a notification for the doctor. This statement is EXPECTED to fail with the RLS error (upsert needs the SELECT policy too):
  insert into public.notifications(id, role, user_ref, title, body) values ('diag1', 'doctor', 'd1', 'x', 'y')
    on conflict (id) do update set title = excluded.title;
rollback;
