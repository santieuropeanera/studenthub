alter table if exists public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

update public.profiles
set onboarding_completed = true,
    onboarding_completed_at = coalesce(onboarding_completed_at, now())
where role in ('teacher', 'admin')
  and onboarding_completed = false;

create index if not exists profiles_onboarding_completed_idx
  on public.profiles (onboarding_completed);

notify pgrst, 'reload schema';
