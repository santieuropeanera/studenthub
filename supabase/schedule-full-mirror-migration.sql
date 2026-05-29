alter table if exists public.schedule_items
  add column if not exists external_key text,
  add column if not exists is_active boolean not null default true;

create unique index if not exists schedule_items_external_key_key
  on public.schedule_items (external_key);

create index if not exists schedule_items_active_group_date_time_idx
  on public.schedule_items (is_active, lower(trim(group_name)), date, time);

update public.schedule_items
set is_active = true
where is_active is null;

notify pgrst, 'reload schema';
