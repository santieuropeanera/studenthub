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

drop policy if exists "profiles own or admin" on public.profiles;

create policy "profiles select own id or email"
on public.profiles
for select
using (
  id = auth.uid()
  or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);

drop policy if exists "student profile own teacher group or admin" on public.student_profiles;

create policy "student profiles select own account"
on public.student_profiles
for select
using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
);

notify pgrst, 'reload schema';
