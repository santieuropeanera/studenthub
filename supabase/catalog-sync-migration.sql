alter table public.internship_placements
add column if not exists external_key text,
add column if not exists source_tab text not null default 'work placements';

alter table public.hospital_medical_centers
add column if not exists external_key text,
add column if not exists source_tab text not null default 'hospitals';

alter table public.accommodations
add column if not exists external_key text,
add column if not exists hospital_medical_center_id uuid references public.hospital_medical_centers(id),
add column if not exists source_tab text not null default 'accommodation';

alter table public.student_profiles
drop column if exists hospital_medical_center_id;

create unique index if not exists internship_placements_external_key_key
on public.internship_placements(external_key);

create unique index if not exists hospital_medical_centers_external_key_key
on public.hospital_medical_centers(external_key);

create unique index if not exists accommodations_external_key_key
on public.accommodations(external_key);

drop policy if exists "hospitals visible to linked users or admin" on public.hospital_medical_centers;

create policy "hospitals visible to linked users or admin" on public.hospital_medical_centers
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.student_profiles sp
    join public.accommodations a on a.id = sp.accommodation_id
    join public.profiles student on student.id = sp.user_id
    join public.profiles viewer on viewer.id = auth.uid()
    where a.hospital_medical_center_id = hospital_medical_centers.id
      and (viewer.id = student.id or viewer.group_id = student.group_id)
  )
);
