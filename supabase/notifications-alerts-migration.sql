create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null check (target_type in ('all', 'group')),
  target_group_name text,
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true
);

create index if not exists notifications_active_target_idx
on public.notifications (is_active, target_type, target_group_name, priority, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications visible to target users or admin" on public.notifications;
drop policy if exists "notifications admin manage all" on public.notifications;

create policy "notifications visible to target users or admin"
on public.notifications
for select
using (
  public.current_user_is_admin()
  or (
    is_active = true
    and (expires_at is null or expires_at > now())
    and (
      target_type = 'all'
      or exists (
        select 1
        from public.profiles p
        left join public.student_profiles sp on sp.user_id = p.id
        left join public.teacher_profiles tp on tp.user_id = p.id
        left join public.groups g on g.id = p.group_id
        left join public.schools s on s.id = p.school_id
        where (p.id = auth.uid() or p.id = public.current_profile_id())
          and regexp_replace(lower(trim(notifications.target_group_name)), '\s+', '', 'g') in (
            regexp_replace(lower(trim(coalesce(p.group_name, ''))), '\s+', '', 'g'),
            regexp_replace(lower(trim(coalesce(sp.group_name, ''))), '\s+', '', 'g'),
            regexp_replace(lower(trim(coalesce(tp.group_name, ''))), '\s+', '', 'g'),
            regexp_replace(lower(trim(coalesce(g.name, ''))), '\s+', '', 'g'),
            regexp_replace(lower(trim(coalesce(s.name, ''))), '\s+', '', 'g')
          )
      )
    )
  )
);

create policy "notifications admin manage all"
on public.notifications
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

notify pgrst, 'reload schema';
