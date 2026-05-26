alter table if exists public.profiles
  add column if not exists invite_status text default 'not_invited',
  add column if not exists invite_sent_at timestamptz,
  add column if not exists auth_user_id uuid,
  add column if not exists last_invite_error text;

update public.profiles
set auth_user_id = id
where auth_user_id is null;

create index if not exists profiles_invite_status_idx
  on public.profiles (invite_status);

create index if not exists profiles_invite_sent_at_idx
  on public.profiles (invite_sent_at);

create index if not exists profiles_auth_user_id_idx
  on public.profiles (auth_user_id);

notify pgrst, 'reload schema';
