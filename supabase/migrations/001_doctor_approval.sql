-- MEDIVANCE migration 001: doctor approval workflow (backend-enforced) + helper hardening.
-- SAFE for an existing project: additive only, no tables dropped, no rows deleted, RLS stays ON.
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run.  Idempotent (can be re-run).

-- ---------- 1. approval columns (all EXISTING doctors become 'approved' automatically) ----------
alter table public.doctors add column if not exists approval_status text not null default 'approved';
alter table public.doctors add column if not exists registered_at timestamptz not null default now();
alter table public.doctors add column if not exists reviewed_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'doctors_approval_status_check') then
    alter table public.doctors add constraint doctors_approval_status_check check (approval_status in ('pending','approved','rejected'));
  end if;
end $$;

-- ---------- 2. helpers ----------
-- my_role(): a doctor only counts as 'doctor' once APPROVED. Pending/rejected doctors get 'doctor_unapproved',
-- which matches none of the existing doctor policies -> approval is enforced by the database, not by the UI.
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as $$
  select case
           when p.role = 'doctor' then
             case when exists (select 1 from public.doctors d where d.id = p.ref_id and d.approval_status = 'approved')
                  then 'doctor' else 'doctor_unapproved' end
           else p.role
         end
  from public.profiles p where p.user_id = auth.uid()
$$;

-- is_privileged(): true for the admin, the dashboard/service role, or inside MEDIVANCE's own security-definer functions.
-- Used only by the guard triggers below (SECURITY INVOKER on purpose, so current_user reflects the real caller).
create or replace function public.is_privileged() returns boolean language sql stable set search_path = public as $$
  select current_user in ('postgres', 'supabase_admin', 'service_role')
      or coalesce(current_setting('medivance.bypass_guard', true), '') = '1'
      or coalesce(public.is_admin(), false)
$$;

-- ---------- 3. public directory shows APPROVED doctors only (own row + admin can still see theirs) ----------
drop policy if exists doc_read on public.doctors;
create policy doc_read on public.doctors for select using (
  approval_status = 'approved' or public.is_admin() or id = public.my_ref()
);

-- ---------- 4. nobody but an admin can change approval / account-link columns ----------
create or replace function public.doctors_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_privileged() then
    if new.approval_status is distinct from old.approval_status
       or new.reviewed_at is distinct from old.reviewed_at
       or new.user_id is distinct from old.user_id
       or new.registered_at is distinct from old.registered_at then
      raise exception 'Only an administrator can change a doctor''s approval status or account link.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists doctors_guard_trg on public.doctors;
create trigger doctors_guard_trg before update on public.doctors for each row execute function public.doctors_guard();

-- ---------- 5. login -> profile linking, now also handles doctor SELF-REGISTRATION (always PENDING) ----------
-- Role still comes ONLY from app_metadata (service key). A sign-up carrying user_metadata.doctor_application=true can
-- only ever create a PENDING doctor that an admin must approve; it can never grant access by itself.
create or replace function public.link_profile(uid uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  u record; r text; m jsonb; pid text; v_langs text[]; v_fee int; v_exp int; v_name text;
begin
  if exists (select 1 from public.profiles where user_id = uid) then return; end if;
  select id, email, raw_app_meta_data, raw_user_meta_data into u from auth.users where id = uid;
  if not found then return; end if;
  r := coalesce(u.raw_app_meta_data ->> 'role', 'patient');
  m := coalesce(u.raw_user_meta_data, '{}'::jsonb);
  perform set_config('medivance.bypass_guard', '1', true);
  if r = 'admin' then
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'admin', 'admin1');
  elsif r = 'doctor' then
    update public.doctors set user_id = u.id where lower(email) = lower(u.email) and user_id is null returning id into pid;
    if pid is null then raise exception 'No doctor record uses the email %', u.email; end if;
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'doctor', pid);
  elsif coalesce(m ->> 'doctor_application', '') = 'true' then
    if exists (select 1 from public.doctors where lower(email) = lower(u.email)) then
      raise exception 'A doctor with the email % is already registered.', u.email using errcode = '23505';
    end if;
    pid := 'd' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    v_exp := case when (m ->> 'experience') ~ '^[0-9]{1,2}$' then least((m ->> 'experience')::int, 60) else 0 end;
    v_fee := case when (m ->> 'fee') ~ '^[0-9]{1,7}$' then (m ->> 'fee')::int else 0 end;
    v_langs := array(select btrim(x) from unnest(string_to_array(coalesce(m ->> 'languages', ''), ',')) as x where btrim(x) <> '');
    if coalesce(array_length(v_langs, 1), 0) = 0 then v_langs := array['English']; end if;
    v_name := left(coalesce(nullif(btrim(m ->> 'name'), ''), split_part(u.email, '@', 1)), 120);
    insert into public.doctors(id, user_id, name, email, phone, specialization, qualification, experience, rating, fee, languages, bio, approval_status)
    values (pid, u.id, v_name, u.email, left(coalesce(m ->> 'phone', ''), 30), left(coalesce(m ->> 'specialization', ''), 120),
            left(coalesce(m ->> 'qualification', ''), 300), v_exp, 0, v_fee, v_langs, left(coalesce(m ->> 'bio', ''), 2000), 'pending');
    insert into public.profiles(user_id, role, ref_id) values (u.id, 'doctor', pid);
    insert into public.notifications(id, role, title, body)
    values ('nd' || pid, 'admin', 'New doctor application', v_name || ' applied to join MEDIVANCE and is waiting for your approval.');
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

-- pre-check used by the registration form (reveals only whether an email is already a doctor record)
create or replace function public.doctor_email_taken(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.doctors where lower(email) = lower(btrim(p_email)))
$$;
revoke all on function public.doctor_email_taken(text) from public;
grant execute on function public.doctor_email_taken(text) to anon, authenticated;

-- ---------- 6. admin approves / rejects an application ----------
create or replace function public.admin_review_doctor(p_doctor_id text, p_decision text) returns void language plpgsql security definer set search_path = public as $$
declare d record;
begin
  if not public.is_admin() then raise exception 'Only an administrator can review doctor applications.' using errcode = '42501'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Decision must be approved or rejected.'; end if;
  select * into d from public.doctors where id = p_doctor_id for update;
  if not found then raise exception 'Doctor application not found.'; end if;
  if d.approval_status = 'approved' then raise exception 'This doctor is already approved.'; end if;
  perform set_config('medivance.bypass_guard', '1', true);
  update public.doctors set approval_status = p_decision, reviewed_at = now() where id = p_doctor_id;
  insert into public.notifications(id, role, user_ref, title, body)
  values ('n' || replace(gen_random_uuid()::text, '-', ''), 'doctor', p_doctor_id,
          case when p_decision = 'approved' then 'Application approved' else 'Application not approved' end,
          case when p_decision = 'approved' then 'Welcome to MEDIVANCE! Your doctor account is now active. Please set your consultation hours under Availability.'
               else 'Your doctor application was not approved. Please contact the administrator.' end);
end $$;
revoke all on function public.admin_review_doctor(text, text) from public, anon;
grant execute on function public.admin_review_doctor(text, text) to authenticated;
