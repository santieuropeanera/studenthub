alter table if exists public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivated_reason text,
  add column if not exists auth_user_id uuid;

update public.profiles
set is_active = true,
    auth_user_id = coalesce(auth_user_id, id)
where is_active is null
   or auth_user_id is null;

create index if not exists profiles_is_active_role_idx
  on public.profiles (is_active, role);

create index if not exists profiles_active_email_idx
  on public.profiles (is_active, lower(trim(email)));

notify pgrst, 'reload schema';
