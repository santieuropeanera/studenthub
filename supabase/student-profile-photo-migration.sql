alter table public.student_profiles
add column if not exists profile_photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-profile-photos',
  'student-profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "student profile photos authenticated read" on storage.objects;
drop policy if exists "students upload own profile photos" on storage.objects;
drop policy if exists "students update own profile photos" on storage.objects;
drop policy if exists "students delete own profile photos" on storage.objects;

create policy "student profile photos authenticated read"
on storage.objects
for select
to authenticated
using (bucket_id = 'student-profile-photos');

create policy "students upload own profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "students update own profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and owner = auth.uid()
)
with check (
  bucket_id = 'student-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "students delete own profile photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-profile-photos'
  and owner = auth.uid()
);

notify pgrst, 'reload schema';
