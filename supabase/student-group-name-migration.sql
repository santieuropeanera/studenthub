alter table public.profiles
add column if not exists group_name text;

alter table public.student_profiles
add column if not exists group_name text;

alter table public.teacher_profiles
add column if not exists group_name text;

update public.profiles p
set group_name = coalesce(g.name, s.name)
from public.groups g
left join public.schools s on s.id = g.school_id
where p.group_id = g.id
  and nullif(trim(coalesce(p.group_name, '')), '') is null;

update public.profiles p
set group_name = s.name
from public.schools s
where p.school_id = s.id
  and nullif(trim(coalesce(p.group_name, '')), '') is null;

update public.student_profiles sp
set group_name = p.group_name
from public.profiles p
where sp.user_id = p.id
  and nullif(trim(coalesce(sp.group_name, '')), '') is null
  and nullif(trim(coalesce(p.group_name, '')), '') is not null;

update public.teacher_profiles tp
set group_name = p.group_name
from public.profiles p
where tp.user_id = p.id
  and nullif(trim(coalesce(tp.group_name, '')), '') is null
  and nullif(trim(coalesce(p.group_name, '')), '') is not null;

drop policy if exists "schedule visible to assigned group or admin" on public.schedule_items;
drop policy if exists "schedule visible to own group name or admin" on public.schedule_items;

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

notify pgrst, 'reload schema';
