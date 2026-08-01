-- Catalog in Postgres.
--
-- Until now products lived in data/products.ts, which meant the admin could
-- never actually create one. This moves them into the database with public
-- read access and admin-only writes.

-- ── CATEGORIES ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  image       text,
  parent_id   uuid references public.categories(id) on delete set null,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── PRODUCTS ────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  brand        text not null,
  title        text not null,
  description  text,
  price        numeric(10,2) not null,
  mrp          numeric(10,2) not null,
  image        text,
  -- Footwear ships in UK sizes; an empty array means one-size (accessories).
  sizes        text[] not null default '{}',
  stock        integer not null default 0,
  weight_grams integer not null default 500,   -- required by Shiprocket
  badge        text,                            -- NEW | SOLD OUT | null
  is_featured  boolean not null default false,
  is_active    boolean not null default true,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_active_idx on public.products(is_active, position);

/** Discount is always derived, never stored — it cannot drift from the prices. */
create or replace function public.product_discount(mrp numeric, price numeric)
returns integer language sql immutable as $$
  select case when mrp > 0 and mrp > price
              then round(((mrp - price) / mrp) * 100)::int
              else 0 end;
$$;

-- ── PRODUCT ↔ CATEGORY (many-to-many) ───────────────────────────────────────
create table if not exists public.product_categories (
  product_id  uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- ── PRODUCT MEDIA ───────────────────────────────────────────────────────────
-- type YOUTUBE covers the "videos in the product gallery" requirement.
create table if not exists public.product_media (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  type        text not null default 'IMAGE',   -- IMAGE | YOUTUBE
  url         text not null,
  alt         text,
  position    integer not null default 0
);

create index if not exists product_media_product_idx on public.product_media(product_id, position);

-- ── RLS: world-readable, admin-writable ─────────────────────────────────────
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_media      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','products','product_categories','product_media'] loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I', t);
    execute format('drop policy if exists "admin writes %1$s" on public.%1$I', t);
    -- Anyone, signed in or not, may read the shop window.
    execute format('create policy "public read %1$s" on public.%1$I for select using (true)', t);
    -- Only an admin may change it.
    execute format(
      'create policy "admin writes %1$s" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();
