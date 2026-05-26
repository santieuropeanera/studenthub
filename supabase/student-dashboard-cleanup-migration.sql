alter table public.student_profiles
add column if not exists phone_number text;

alter table public.accommodations
add column if not exists hospital_medical_center_id uuid references public.hospital_medical_centers(id),
add column if not exists hospital_external_key text,
add column if not exists hospital_name text,
add column if not exists maps_url text;

alter table public.hospital_medical_centers
add column if not exists maps_url text;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  limit 1
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where (
      id = auth.uid()
      or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
    and role = 'admin'
  )
$$;

drop policy if exists "student profiles update own contact details or admin" on public.student_profiles;

create policy "student profiles update own contact details or admin"
on public.student_profiles
for update
using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
)
with check (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
);

notify pgrst, 'reload schema';
