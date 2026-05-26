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

drop policy if exists "accommodations visible to linked users or admin" on public.accommodations;

create policy "accommodations visible to linked student or admin"
on public.accommodations
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.student_profiles sp
    where sp.accommodation_id = accommodations.id
      and sp.user_id = public.current_profile_id()
  )
);

drop policy if exists "hospitals visible to linked users or admin" on public.hospital_medical_centers;

create policy "hospitals visible to linked student or admin"
on public.hospital_medical_centers
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.student_profiles sp
    join public.accommodations a on a.id = sp.accommodation_id
    where sp.user_id = public.current_profile_id()
      and a.hospital_medical_center_id = hospital_medical_centers.id
  )
);

notify pgrst, 'reload schema';
