create or replace function public.normalized_group_key(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '\s+', '', 'g')
$$;

create or replace function public.current_teacher_group_keys()
returns text[]
language sql
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct group_key), array[]::text[])
  from (
    select nullif(public.normalized_group_key(p.group_name), '') as group_key
    from public.profiles p
    left join public.teacher_profiles tp on tp.user_id = p.id
    left join public.groups g on g.id = coalesce(tp.group_id, p.group_id)
    left join public.schools s on s.id = coalesce(tp.school_id, p.school_id)
    where (
        p.id = auth.uid()
        or lower(trim(p.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      )
      and p.role = 'teacher'

    union

    select nullif(public.normalized_group_key(tp.group_name), '')
    from public.profiles p
    left join public.teacher_profiles tp on tp.user_id = p.id
    where (
        p.id = auth.uid()
        or lower(trim(p.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      )
      and p.role = 'teacher'

    union

    select nullif(public.normalized_group_key(g.name), '')
    from public.profiles p
    left join public.teacher_profiles tp on tp.user_id = p.id
    left join public.groups g on g.id = coalesce(tp.group_id, p.group_id)
    where (
        p.id = auth.uid()
        or lower(trim(p.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      )
      and p.role = 'teacher'

    union

    select nullif(public.normalized_group_key(s.name), '')
    from public.profiles p
    left join public.teacher_profiles tp on tp.user_id = p.id
    left join public.schools s on s.id = coalesce(tp.school_id, p.school_id)
    where (
        p.id = auth.uid()
        or lower(trim(p.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      )
      and p.role = 'teacher'
  ) keys
  where group_key is not null
$$;

drop policy if exists "profiles select own id or email" on public.profiles;
drop policy if exists "profiles select own same group or admin" on public.profiles;

create policy "profiles select own same group or admin"
on public.profiles
for select
using (
  id = auth.uid()
  or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  or public.current_user_is_admin()
  or (
    role = 'student'
    and public.normalized_group_key(group_name) = any(coalesce(public.current_teacher_group_keys(), array[]::text[]))
  )
);

drop policy if exists "student profiles select own account or admin" on public.student_profiles;
drop policy if exists "student profiles select own teacher group or admin" on public.student_profiles;

create policy "student profiles select own teacher group or admin"
on public.student_profiles
for select
using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
  or exists (
    select 1
    from public.profiles student
    where student.id = student_profiles.user_id
      and public.normalized_group_key(coalesce(student.group_name, student_profiles.group_name)) = any(coalesce(public.current_teacher_group_keys(), array[]::text[]))
  )
);

drop policy if exists "teacher profiles select own or admin" on public.teacher_profiles;

create policy "teacher profiles select own or admin"
on public.teacher_profiles
for select
using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
);

drop policy if exists "placements visible to linked users or admin" on public.internship_placements;
drop policy if exists "placements visible to linked users teacher group or admin" on public.internship_placements;

create policy "placements visible to linked users teacher group or admin"
on public.internship_placements
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.student_profiles sp
    join public.profiles student on student.id = sp.user_id
    where sp.internship_placement_id = internship_placements.id
      and (
        student.id = auth.uid()
        or student.id = public.current_profile_id()
        or public.normalized_group_key(coalesce(student.group_name, sp.group_name)) = any(coalesce(public.current_teacher_group_keys(), array[]::text[]))
      )
  )
);

drop policy if exists "accommodations visible to linked users or admin" on public.accommodations;
drop policy if exists "accommodations visible to linked users teacher group or admin" on public.accommodations;

create policy "accommodations visible to linked users teacher group or admin"
on public.accommodations
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.student_profiles sp
    join public.profiles student on student.id = sp.user_id
    where sp.accommodation_id = accommodations.id
      and (
        student.id = auth.uid()
        or student.id = public.current_profile_id()
        or public.normalized_group_key(coalesce(student.group_name, sp.group_name)) = any(coalesce(public.current_teacher_group_keys(), array[]::text[]))
      )
  )
);

drop policy if exists "hospitals visible to linked users or admin" on public.hospital_medical_centers;
drop policy if exists "hospitals visible to linked users teacher group or admin" on public.hospital_medical_centers;

create policy "hospitals visible to linked users teacher group or admin"
on public.hospital_medical_centers
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.student_profiles sp
    join public.accommodations a on a.id = sp.accommodation_id
    join public.profiles student on student.id = sp.user_id
    where a.hospital_medical_center_id = hospital_medical_centers.id
      and (
        student.id = auth.uid()
        or student.id = public.current_profile_id()
        or public.normalized_group_key(coalesce(student.group_name, sp.group_name)) = any(coalesce(public.current_teacher_group_keys(), array[]::text[]))
      )
  )
);

notify pgrst, 'reload schema';
