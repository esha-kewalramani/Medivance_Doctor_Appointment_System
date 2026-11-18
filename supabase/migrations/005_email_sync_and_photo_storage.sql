-- MEDIVANCE migration 005: (a) keep profile email in step with Supabase Auth after a VERIFIED email change,
-- (b) storage bucket for doctor photographs uploaded by the admin. Additive/idempotent.

-- (a) Supabase Auth owns the login email. After the user verifies a change, the next sign-in/page load calls this function
-- so patients/doctors/settings show the same address. It only reads auth.users; it never writes to it.
create or replace function public.sync_my_email() returns void language plpgsql security definer set search_path = public as $$
declare v_email text; p record;
begin
  if auth.uid() is null then return; end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  select * into p from public.profiles where user_id = auth.uid();
  if not found or v_email is null then return; end if;
  begin
    if p.role = 'patient' then
      update public.patients set email = v_email where id = p.ref_id and lower(email) <> v_email;
    elsif p.role = 'doctor' then
      update public.doctors set email = v_email where id = p.ref_id and lower(email) <> v_email;
    elsif p.role = 'admin' then
      update public.settings set admin_email = v_email where id = 'main' and lower(admin_email) <> v_email;
    end if;
  exception when unique_violation then null;   -- another profile already uses that address: leave as is
  end;
end $$;
revoke all on function public.sync_my_email() from public, anon;
grant execute on function public.sync_my_email() to authenticated;

-- (b) doctor photos: public read (photos are shown on the public doctor pages), only the admin can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doctor-photos', 'doctor-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists doctor_photos_admin_insert on storage.objects;
drop policy if exists doctor_photos_admin_update on storage.objects;
drop policy if exists doctor_photos_admin_delete on storage.objects;
create policy doctor_photos_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'doctor-photos' and public.is_admin());
create policy doctor_photos_admin_update on storage.objects for update to authenticated using (bucket_id = 'doctor-photos' and public.is_admin()) with check (bucket_id = 'doctor-photos' and public.is_admin());
create policy doctor_photos_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'doctor-photos' and public.is_admin());
