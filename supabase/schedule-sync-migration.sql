create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  group_name text,
  title text not null,
  date date not null,
  time text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.schedule_items
add column if not exists group_name text,
add column if not exists time text,
add column if not exists notes text,
add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schedule_items'
      and column_name = 'start_time'
  ) then
    alter table public.schedule_items alter column start_time drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schedule_items'
      and column_name = 'end_time'
  ) then
    alter table public.schedule_items alter column end_time drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schedule_items'
      and column_name = 'type'
  ) then
    alter table public.schedule_items alter column type drop not null;
  end if;
end $$;

create index if not exists schedule_items_group_name_date_time_idx
on public.schedule_items (lower(trim(group_name)), date, time);

alter table public.schedule_items enable row level security;

drop policy if exists "schedule visible to assigned group or admin" on public.schedule_items;
drop policy if exists "schedule visible to own group name or admin" on public.schedule_items;
drop policy if exists "schedule admin manage all" on public.schedule_items;

create policy "schedule visible to own group name or admin"
on public.schedule_items
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.profiles p
    left join public.student_profiles sp on sp.user_id = p.id
    left join public.teacher_profiles tp on tp.user_id = p.id
    left join public.groups g on g.id = p.group_id
    left join public.schools s on s.id = p.school_id
    where (p.id = auth.uid() or p.id = public.current_profile_id())
      and (
        lower(trim(schedule_items.group_name)) = lower(trim(p.group_name))
        or lower(trim(schedule_items.group_name)) = lower(trim(sp.group_name))
        or lower(trim(schedule_items.group_name)) = lower(trim(tp.group_name))
        or lower(trim(schedule_items.group_name)) = lower(trim(g.name))
        or lower(trim(schedule_items.group_name)) = lower(trim(s.name))
      )
  )
);

create policy "schedule admin manage all"
on public.schedule_items
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

notify pgrst, 'reload schema';
