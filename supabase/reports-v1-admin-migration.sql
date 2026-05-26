alter table if exists public.reports
add column if not exists description text,
add column if not exists author_id uuid references public.profiles(id),
add column if not exists date date not null default current_date,
add column if not exists category text not null default 'Internal',
add column if not exists created_at timestamptz not null default now();

drop policy if exists "reports admin only" on public.reports;

create policy "reports admin select"
on public.reports
for select
using (public.current_user_is_admin());

create policy "reports admin insert"
on public.reports
for insert
with check (public.current_user_is_admin());

create policy "reports admin update"
on public.reports
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "reports admin delete"
on public.reports
for delete
using (public.current_user_is_admin());

notify pgrst, 'reload schema';
