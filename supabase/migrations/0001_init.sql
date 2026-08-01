-- Diamond Stepss — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before using the app.
--
-- Every table is owned by a customer and protected by row-level security, so the
-- browser can talk to the database directly with the anon key and still only ever
-- see its own rows.

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically by the trigger at the bottom.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;

create policy "own profile read"   on public.profiles for select using  (auth.uid() = id);
create policy "own profile update" on public.profiles for update using  (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null default 'HOME',          -- HOME | WORK | OTHER
  name        text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);

alter table public.addresses enable row level security;

drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Only one default address per customer: clearing the others is done in a trigger
-- rather than the client, so it holds no matter who writes.
create or replace function public.enforce_single_default_address()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_default then
    update public.addresses
       set is_default = false
     where user_id = new.user_id
       and id <> new.id
       and is_default;
  end if;
  return new;
end $$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
  after insert or update of is_default on public.addresses
  for each row when (new.is_default)
  execute function public.enforce_single_default_address();

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- amount_paid_online + amount_due_on_delivery = total.
-- That single pair is what lets PREPAID, COD and PARTIAL_COD share one code path.
create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  order_number            text not null unique,
  status                  text not null default 'CONFIRMED',
    -- CONFIRMED | PACKED | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
  payment_mode            text not null default 'PREPAID',  -- PREPAID | COD | PARTIAL_COD
  payment_status          text not null default 'PENDING',  -- PENDING | PAID | REFUNDED
  subtotal                numeric(10,2) not null default 0,
  discount                numeric(10,2) not null default 0,
  shipping_fee            numeric(10,2) not null default 0,
  cod_fee                 numeric(10,2) not null default 0,
  total                   numeric(10,2) not null default 0,
  amount_paid_online      numeric(10,2) not null default 0,
  amount_due_on_delivery  numeric(10,2) not null default 0,
  courier                 text,
  awb                     text,
  shipping_address        jsonb,
  placed_at               timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id, placed_at desc);

alter table public.orders enable row level security;

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text not null,
  brand       text not null,
  title       text not null,
  size        text,
  qty         integer not null default 1,
  price       numeric(10,2) not null,
  image       text
);

create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.order_items enable row level security;

-- Items are reachable only through an order the caller owns.
drop policy if exists "own order items" on public.order_items;
create policy "own order items" on public.order_items
  for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ─── WISHLIST ────────────────────────────────────────────────────────────────
-- Products live in the front-end catalog for now, so we store the product id as
-- text. When the catalog moves into Postgres this becomes a real foreign key.
create table if not exists public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_user_idx on public.wishlist(user_id);

alter table public.wishlist enable row level security;

drop policy if exists "own wishlist" on public.wishlist;
create policy "own wishlist" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── PROFILE AUTO-CREATION ───────────────────────────────────────────────────
-- Without this, a brand-new user signs in and has no profile row to read.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
