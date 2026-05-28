alter table if exists public.profiles
  add column if not exists teacher_onboarding_completed boolean not null default false,
  add column if not exists teacher_onboarding_completed_at timestamptz;

update public.profiles
set teacher_onboarding_completed = true,
    teacher_onboarding_completed_at = coalesce(teacher_onboarding_completed_at, now())
where role in ('student', 'admin')
  and teacher_onboarding_completed = false;

create index if not exists profiles_teacher_onboarding_completed_idx
  on public.profiles (teacher_onboarding_completed);

notify pgrst, 'reload schema';
