create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

insert into public.persons (name, code)
values
  ('Marcos', 'marcos'),
  ('Nayeli', 'nayeli')
on conflict (code) do nothing;

create table if not exists public.personal_movements (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  movement_date date not null,
  type text not null,
  category text not null,
  description text,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint personal_movements_type_check
    check (type in ('salary', 'income', 'expense'))
);

create index if not exists personal_movements_person_id_idx
  on public.personal_movements (person_id);

create index if not exists personal_movements_movement_date_idx
  on public.personal_movements (movement_date);

create table if not exists public.trip_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  type text not null,
  category text not null,
  description text,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint trip_movements_type_check
    check (type in ('initial', 'income', 'expense'))
);

create index if not exists trip_movements_movement_date_idx
  on public.trip_movements (movement_date);

create table if not exists public.savings_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  currency text not null,
  type text not null,
  description text,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint savings_movements_currency_check
    check (currency in ('PEN', 'USD')),
  constraint savings_movements_type_check
    check (type in ('deposit', 'withdrawal'))
);

create index if not exists savings_movements_movement_date_idx
  on public.savings_movements (movement_date);

create index if not exists savings_movements_currency_idx
  on public.savings_movements (currency);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value)
values
  ('trip_name', 'Viaje'),
  ('savings_goal_name', 'Objetivo de ahorro'),
  ('savings_goal_amount_pen', '0')
on conflict (key) do nothing;

alter table public.persons enable row level security;
alter table public.personal_movements enable row level security;
alter table public.trip_movements enable row level security;
alter table public.savings_movements enable row level security;
alter table public.settings enable row level security;

create policy "authenticated select persons"
  on public.persons
  for select
  to authenticated
  using (true);

create policy "authenticated insert persons"
  on public.persons
  for insert
  to authenticated
  with check (true);

create policy "authenticated update persons"
  on public.persons
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete persons"
  on public.persons
  for delete
  to authenticated
  using (true);

create policy "authenticated select personal_movements"
  on public.personal_movements
  for select
  to authenticated
  using (true);

create policy "authenticated insert personal_movements"
  on public.personal_movements
  for insert
  to authenticated
  with check (true);

create policy "authenticated update personal_movements"
  on public.personal_movements
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete personal_movements"
  on public.personal_movements
  for delete
  to authenticated
  using (true);

create policy "authenticated select trip_movements"
  on public.trip_movements
  for select
  to authenticated
  using (true);

create policy "authenticated insert trip_movements"
  on public.trip_movements
  for insert
  to authenticated
  with check (true);

create policy "authenticated update trip_movements"
  on public.trip_movements
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete trip_movements"
  on public.trip_movements
  for delete
  to authenticated
  using (true);

create policy "authenticated select savings_movements"
  on public.savings_movements
  for select
  to authenticated
  using (true);

create policy "authenticated insert savings_movements"
  on public.savings_movements
  for insert
  to authenticated
  with check (true);

create policy "authenticated update savings_movements"
  on public.savings_movements
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete savings_movements"
  on public.savings_movements
  for delete
  to authenticated
  using (true);

create policy "authenticated select settings"
  on public.settings
  for select
  to authenticated
  using (true);

create policy "authenticated insert settings"
  on public.settings
  for insert
  to authenticated
  with check (true);

create policy "authenticated update settings"
  on public.settings
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated delete settings"
  on public.settings
  for delete
  to authenticated
  using (true);
