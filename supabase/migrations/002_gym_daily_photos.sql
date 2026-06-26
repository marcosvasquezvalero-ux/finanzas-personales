create table if not exists public.gym_daily_photos (
  id uuid primary key default gen_random_uuid(),
  photo_date date not null unique,
  image_path text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_daily_photos_photo_date_idx
  on public.gym_daily_photos (photo_date);

alter table public.gym_daily_photos enable row level security;

create policy "authenticated select gym_daily_photos"
  on public.gym_daily_photos
  for select
  to authenticated
  using (true);

create policy "authenticated insert gym_daily_photos"
  on public.gym_daily_photos
  for insert
  to authenticated
  with check (true);

create policy "authenticated update gym_daily_photos"
  on public.gym_daily_photos
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete gym_daily_photos"
  on public.gym_daily_photos
  for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('gym-photos', 'gym-photos', true)
on conflict (id) do nothing;

create policy "authenticated select gym photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'gym-photos');

create policy "authenticated insert gym photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'gym-photos');

create policy "authenticated update gym photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'gym-photos')
  with check (bucket_id = 'gym-photos');

create policy "authenticated delete gym photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'gym-photos');
