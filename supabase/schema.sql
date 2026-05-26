create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.schedule_type as enum ('activity', 'meeting', 'transport', 'internship', 'free time', 'important notice');
create type public.report_status as enum ('open', 'in progress', 'closed');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  arrival_date date,
  departure_date date,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null unique,
  phone text,
  school_id uuid references public.schools(id),
  group_id uuid references public.groups(id),
  group_name text,
  created_at timestamptz not null default now()
);

create table public.internship_placements (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  name text not null,
  address text,
  maps_url text,
  working_hours text,
  source_tab text not null default 'work placements',
  created_at timestamptz not null default now()
);

create table public.hospital_medical_centers (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  name text not null,
  address text,
  maps_url text,
  source_tab text not null default 'hospitals',
  created_at timestamptz not null default now()
);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  name text not null,
  address text,
  emergency_phone text,
  maps_url text,
  hospital_medical_center_id uuid references public.hospital_medical_centers(id),
  source_tab text not null default 'accommodation',
  created_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date,
  nationality text,
  mobility_code text,
  emergency_contact text,
  phone_number text,
  profile_photo_url text,
  emergency_public_token text unique,
  emergency_card_enabled boolean not null default true,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  group_name text,
  internship_placement_id uuid references public.internship_placements(id),
  accommodation_id uuid references public.accommodations(id)
);

create table public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id),
  group_id uuid not null references public.groups(id),
  group_name text
);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  group_name text,
  title text not null,
  date date not null,
  time text,
  notes text,
  description text,
  start_time time,
  end_time time,
  location text,
  maps_url text,
  type public.schedule_type,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.schedule_item_groups (
  schedule_item_id uuid references public.schedule_items(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  primary key (schedule_item_id, group_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  minimum_participants integer,
  age_requirement text,
  date date,
  time time,
  location text,
  image_url text,
  whatsapp_booking_url text,
  is_active boolean not null default true,
  whatsapp_booking_message text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_groups (
  activity_id uuid references public.activities(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  primary key (activity_id, group_id)
);

create table public.whatsapp_booking_logs (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities(id),
  student_id uuid references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.shared_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.shared_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.shared_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.shared_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.shared_posts(id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  author_id uuid references public.profiles(id),
  category text not null,
  related_student_id uuid references public.profiles(id),
  related_group_id uuid references public.groups(id),
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
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

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  subject text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create table public.google_sheets_sync_logs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null,
  imported_rows integer default 0,
  error text
);

alter table public.profiles enable row level security;
alter table public.internship_placements enable row level security;
alter table public.accommodations enable row level security;
alter table public.hospital_medical_centers enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.activities enable row level security;
alter table public.shared_posts enable row level security;
alter table public.shared_post_comments enable row level security;
alter table public.schedule_items enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  limit 1
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where (
      id = auth.uid()
      or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
    and role = 'admin'
  )
$$;

create policy "profiles select own id or email" on public.profiles
for select using (
  id = auth.uid()
  or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);

create policy "student profiles select own account or admin" on public.student_profiles
for select using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
);

create policy "student profiles update own contact details or admin" on public.student_profiles
for update using (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
) with check (
  user_id = auth.uid()
  or user_id = public.current_profile_id()
  or public.current_user_is_admin()
);

create policy "placements visible to linked users or admin" on public.internship_placements
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.student_profiles sp
    join public.profiles student on student.id = sp.user_id
    join public.profiles viewer on viewer.id = auth.uid()
    where sp.internship_placement_id = internship_placements.id
      and (viewer.id = student.id or viewer.group_id = student.group_id)
  )
);

create policy "accommodations visible to linked users or admin" on public.accommodations
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.student_profiles sp
    join public.profiles student on student.id = sp.user_id
    join public.profiles viewer on viewer.id = auth.uid()
    where sp.accommodation_id = accommodations.id
      and (viewer.id = student.id or viewer.group_id = student.group_id)
  )
);

create policy "hospitals visible to linked users or admin" on public.hospital_medical_centers
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.student_profiles sp
    join public.accommodations a on a.id = sp.accommodation_id
    join public.profiles student on student.id = sp.user_id
    join public.profiles viewer on viewer.id = auth.uid()
    where a.hospital_medical_center_id = hospital_medical_centers.id
      and (viewer.id = student.id or viewer.group_id = student.group_id)
  )
);

create policy "schedule visible to own group name or admin" on public.schedule_items
for select using (
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

create policy "schedule admin manage all" on public.schedule_items
for all using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "activities active visible to authenticated users or admin" on public.activities
for select using (
  public.current_user_is_admin()
  or (auth.uid() is not null and is_active = true)
);

create policy "activities admin manage all" on public.activities
for all using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "shared posts same group or admin" on public.shared_posts
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or p.group_id = shared_posts.group_id)
  )
);

create policy "reports admin only" on public.reports
for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "notifications visible to target users or admin" on public.notifications
for select using (
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

create policy "notifications admin manage all" on public.notifications
for all using (public.current_user_is_admin())
with check (public.current_user_is_admin());
