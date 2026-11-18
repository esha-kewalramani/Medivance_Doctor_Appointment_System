-- !!! WARNING: ORIGINAL BASELINE SCHEMA - DO NOT RUN ON YOUR EXISTING PROJECT. !!!
-- This file DROPS and recreates the MEDIVANCE tables (all data lost). It is only for a brand-new, empty Supabase project.
-- For your existing project run the incremental files in supabase/migrations/ (001 -> 005) instead. They only add things.
-- (After a fresh run of this file you would also run migrations 001-005.)

-- MEDIVANCE database schema for Supabase.
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: it drops and recreates the MEDIVANCE tables (all MEDIVANCE data is lost).

drop view if exists public.busy_slots;
drop table if exists public.favorites, public.notifications, public.appointments, public.reviews, public.availability,
  public.doctors, public.patients, public.specializations, public.settings, public.profiles cascade;

-- ---------- tables ----------
create table public.specializations (
  id text primary key, name text unique not null, description text not null default '', icon text not null default ''
);

create table public.doctors (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null, email text unique not null, phone text not null default '',
  specialization text not null default '', qualification text not null default '',
  experience int not null default 0, rating numeric(2,1) not null default 4.5, fee int not null default 0,
  languages text[] not null default '{}', bio text not null default '', photo text,
  slot_minutes int not null default 30
);

create table public.availability (
  id text primary key, doctor_id text not null references public.doctors(id) on delete cascade,
  day text not null check (day in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time text not null, end_time text not null
);

create table public.reviews (
  id text primary key, doctor_id text not null references public.doctors(id) on delete cascade,
  author text not null, rating int not null check (rating between 1 and 5), "text" text not null, "date" text not null
);

create table public.patients (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null, email text unique not null, phone text not null default '', dob text not null default '',
  gender text not null default 'Other', address text, blood_group text, registered_at timestamptz not null default now()
);

create table public.appointments (
  id text primary key, ref text unique not null, patient_id text not null, doctor_id text not null,
  "date" text not null, "time" text not null, reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','completed')),
  created_at timestamptz not null default now(), notes text
);
-- THE no-double-booking rule: one active appointment per doctor, date and time.
create unique index appointments_no_double_booking on public.appointments (doctor_id, "date", "time")
  where status in ('pending','approved','completed');
create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_doctor_idx on public.appointments (doctor_id);

create table public.notifications (
  id text primary key, role text not null check (role in ('patient','doctor','admin')), user_ref text,
  title text not null, body text not null, "time" timestamptz not null default now(), read boolean not null default false
);

create table public.settings (
  id text primary key default 'main',
  site_name text not null default 'MEDIVANCE', support_email text not null default '', support_phone text not null default '',
  slot_minutes int not null default 30, allow_registration boolean not null default true,
  email_notifications boolean not null default true, sms_notifications boolean not null default false,
  appointment_reminders boolean not null default true,
  admin_name text not null default 'Administrator', admin_email text not null default '', admin_phone text not null default ''
);

create table public.favorites (
  patient_id text not null, doctor_id text not null, primary key (patient_id, doctor_id)
);

-- links a Supabase login to a role and to the doctor/patient row
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','doctor','admin')), ref_id text not null
);

-- busy time slots only (no patient data), so patients can see which times are taken
create view public.busy_slots as
  select doctor_id, "date", "time" from public.appointments where status in ('pending','approved','completed');
grant select on public.busy_slots to anon, authenticated;

-- ---------- helper functions ----------
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where user_id = auth.uid() $$;
create or replace function public.my_ref() returns text language sql stable security definer set search_path = public as
$$ select ref_id from public.profiles where user_id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() = 'admin', false) $$;

-- ---------- login -> profile linking (robust version) ----------
create or replace function public.link_profile(uid uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  u record; r text; m jsonb; pid text;
begin
  if exists (select 1 from public.profiles where user_id = uid) then return; end if;
  select id, email, raw_app_meta_data, raw_user_meta_data into u from auth.users where id = uid;
  if not found then return; end if;
  r := coalesce(u.raw_app_meta_data ->> 'role', 'patient');
  m := coalesce(u.raw_user_meta_data, '{}'::jsonb);
  if r = 'admin' then
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'admin', 'admin1');
  elsif r = 'doctor' then
    update public.doctors set user_id = u.id where lower(email) = lower(u.email) and user_id is null returning id into pid;
    if pid is null then raise exception 'No doctor record uses the email %', u.email; end if;
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'doctor', pid);
  else
    update public.patients set user_id = u.id where lower(email) = lower(u.email) and user_id is null returning id into pid;
    if pid is null then
      pid := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
      insert into public.patients(id, user_id, name, email, phone, dob, gender, address, blood_group)
      values (pid, u.id, coalesce(m ->> 'name', split_part(u.email, '@', 1)), u.email, coalesce(m ->> 'phone', ''),
              coalesce(m ->> 'dob', ''), coalesce(m ->> 'gender', 'Other'), m ->> 'address', m ->> 'blood_group');
      insert into public.notifications(id, role, title, body)
      values ('n' || pid, 'admin', 'New patient registered', coalesce(m ->> 'name', u.email) || ' just created an account.');
    end if;
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'patient', pid);
  end if;
end $$;
revoke all on function public.link_profile(uuid) from public, anon, authenticated;
grant execute on function public.link_profile(uuid) to service_role;

-- No trigger on auth.users (it can block creating logins). Profiles are linked by link_profile():
-- the seed script calls it, and the app calls claim_profile() on first sign-in.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- called by the app right after sign-in when no profile exists yet
create or replace function public.claim_profile() returns void language sql security definer set search_path = public as
$$ select public.link_profile(auth.uid()) $$;
revoke all on function public.claim_profile() from public, anon;
grant execute on function public.claim_profile() to authenticated;

-- let the database's own functions write to every table even if row security is on
do $$
declare t text;
begin
  foreach t in array array['specializations','doctors','availability','reviews','patients','appointments','notifications','settings','favorites','profiles'] loop
    execute format('drop policy if exists definer_all on public.%I', t);
    execute format('create policy definer_all on public.%I for all to postgres using (true) with check (true)', t);
  end loop;
end $$;

-- a new review blends into the doctor's rating (same formula as the app)
create or replace function public.blend_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.reviews where doctor_id = new.doctor_id and id <> new.id;
  update public.doctors set rating = round(((rating * greatest(n, 1) + new.rating) / (n + 1))::numeric, 1) where id = new.doctor_id;
  return new;
end $$;
create trigger reviews_blend_rating after insert on public.reviews for each row execute function public.blend_rating();

-- ---------- Row Level Security ----------
alter table public.specializations enable row level security;
alter table public.doctors enable row level security;
alter table public.availability enable row level security;
alter table public.reviews enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;
alter table public.favorites enable row level security;
alter table public.profiles enable row level security;

-- public directory (anyone can browse)
create policy spec_read on public.specializations for select using (true);
create policy spec_admin on public.specializations for all using (public.is_admin()) with check (public.is_admin());
create policy doc_read on public.doctors for select using (true);
create policy doc_admin_ins on public.doctors for insert with check (public.is_admin());
create policy doc_admin_del on public.doctors for delete using (public.is_admin());
create policy doc_update on public.doctors for update
  using (public.is_admin() or (public.my_role() = 'doctor' and id = public.my_ref()))
  with check (public.is_admin() or (public.my_role() = 'doctor' and id = public.my_ref()));
create policy avail_read on public.availability for select using (true);
create policy avail_write on public.availability for all
  using (public.is_admin() or (public.my_role() = 'doctor' and doctor_id = public.my_ref()))
  with check (public.is_admin() or (public.my_role() = 'doctor' and doctor_id = public.my_ref()));
create policy rev_read on public.reviews for select using (true);
create policy rev_insert on public.reviews for insert with check (public.my_role() in ('patient','admin'));
create policy rev_admin on public.reviews for delete using (public.is_admin());
create policy set_read on public.settings for select using (true);
create policy set_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- patients: own row, admin, or a doctor who has an appointment with them
create policy pat_read on public.patients for select using (
  public.is_admin() or id = public.my_ref()
  or (public.my_role() = 'doctor' and exists (select 1 from public.appointments a where a.patient_id = patients.id and a.doctor_id = public.my_ref()))
);
create policy pat_update on public.patients for update using (public.is_admin() or id = public.my_ref())
  with check (public.is_admin() or id = public.my_ref());
create policy pat_admin_ins on public.patients for insert with check (public.is_admin());
create policy pat_admin_del on public.patients for delete using (public.is_admin());

-- appointments
create policy appt_read on public.appointments for select using (
  public.is_admin() or patient_id = public.my_ref() or doctor_id = public.my_ref()
);
create policy appt_insert on public.appointments for insert with check (
  public.is_admin() or (public.my_role() = 'patient' and patient_id = public.my_ref())
);
create policy appt_update on public.appointments for update
  using (public.is_admin() or patient_id = public.my_ref() or doctor_id = public.my_ref())
  with check (public.is_admin() or patient_id = public.my_ref() or doctor_id = public.my_ref());
create policy appt_delete on public.appointments for delete using (public.is_admin());

-- notifications: each person sees their own role's messages
create policy notif_read on public.notifications for select using (
  (role = 'admin' and public.is_admin())
  or (role = public.my_role() and role <> 'admin' and (user_ref is null or user_ref = public.my_ref()))
);
create policy notif_insert on public.notifications for insert with check (auth.uid() is not null);
create policy notif_update on public.notifications for update using (
  (role = 'admin' and public.is_admin())
  or (role = public.my_role() and role <> 'admin' and (user_ref is null or user_ref = public.my_ref()))
);
create policy notif_delete on public.notifications for delete using (
  (role = 'admin' and public.is_admin())
  or (role = public.my_role() and role <> 'admin' and (user_ref is null or user_ref = public.my_ref()))
);

create policy fav_own on public.favorites for all
  using (patient_id = public.my_ref()) with check (patient_id = public.my_ref());
create policy prof_read on public.profiles for select using (user_id = auth.uid());

-- default settings row
insert into public.settings (id) values ('main') on conflict do nothing;
