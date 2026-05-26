alter table public.student_profiles
add column if not exists emergency_public_token text,
add column if not exists emergency_card_enabled boolean not null default true;

update public.student_profiles
set emergency_public_token = replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
where emergency_public_token is null;

create unique index if not exists student_profiles_emergency_public_token_key
on public.student_profiles (emergency_public_token)
where emergency_public_token is not null;

notify pgrst, 'reload schema';
