alter table public.activities
add column if not exists category text,
add column if not exists minimum_participants integer,
add column if not exists age_requirement text,
add column if not exists whatsapp_booking_url text,
add column if not exists is_active boolean not null default true;

alter table public.activities
alter column date drop not null,
alter column time drop not null;

create index if not exists activities_active_category_idx
on public.activities (is_active, category, created_at desc);

alter table public.activities enable row level security;

drop policy if exists "activities visible to assigned group or admin" on public.activities;
drop policy if exists "activities active visible to authenticated users or admin" on public.activities;
drop policy if exists "activities admin manage all" on public.activities;

create policy "activities active visible to authenticated users or admin"
on public.activities
for select
using (
  public.current_user_is_admin()
  or (auth.uid() is not null and is_active = true)
);

create policy "activities admin manage all"
on public.activities
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.activities (
  title,
  description,
  category,
  minimum_participants,
  age_requirement,
  image_url,
  whatsapp_booking_url,
  is_active
)
values
  (
    'Guided Cathedral Visit',
    'Discover Malaga Cathedral with a guided cultural visit through one of the city''s most important landmarks.',
    'Culture',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Guided%20Cathedral%20Visit.',
    true
  ),
  (
    'Quiz Night at Morrisseys Pub',
    'Enjoy a friendly quiz night with other students in a relaxed international pub atmosphere.',
    'Social',
    null,
    '18+ recommended',
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Quiz%20Night%20at%20Morrisseys%20Pub.',
    true
  ),
  (
    'Pizza Experience',
    'Share a casual pizza experience with your group and enjoy time together outside the workday.',
    'Food',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Pizza%20Experience.',
    true
  ),
  (
    'Coffee & Brunch',
    'Take a relaxed break with coffee, brunch, and conversation in Malaga.',
    'Food',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Coffee%20%26%20Brunch.',
    true
  ),
  (
    'Boat Trip',
    'Experience Malaga from the sea with a group boat trip along the coast.',
    'Experience',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Boat%20Trip.',
    true
  ),
  (
    'Sunset Boat Trip',
    'Enjoy a scenic sunset boat trip and see Malaga from a different point of view.',
    'Experience',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Sunset%20Boat%20Trip.',
    true
  ),
  (
    'Flamenco Show',
    'Attend a flamenco performance and experience one of Andalusia''s most iconic cultural traditions.',
    'Culture',
    null,
    null,
    null,
    'https://wa.me/34617916957?text=Hi%20European%20Era%2C%20I%20would%20like%20to%20book%20this%20activity%3A%20Flamenco%20Show.',
    true
  )
on conflict do nothing;

notify pgrst, 'reload schema';
