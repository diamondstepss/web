-- Coupons and store settings — the last two admin sections that needed tables.

create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  type              text not null default 'PERCENT',   -- PERCENT | FLAT | FREESHIP
  value             numeric(10,2) not null default 0,
  min_order         numeric(10,2) not null default 0,
  usage_limit       integer,                            -- null = unlimited
  used_count        integer not null default 0,
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Single-row table: the store's commercial rules, editable without a deploy.
create table if not exists public.store_settings (
  id                      boolean primary key default true,
  free_shipping_over      numeric(10,2) not null default 999,
  shipping_fee            numeric(10,2) not null default 99,
  cod_enabled             boolean not null default true,
  cod_fee                 numeric(10,2) not null default 49,
  cod_max_order           numeric(10,2) not null default 10000,
  partial_cod_enabled     boolean not null default true,
  partial_cod_advance     numeric(10,2) not null default 300,
  prepaid_discount_pct    integer not null default 5,
  updated_at              timestamptz not null default now(),
  constraint single_row check (id)
);

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

alter table public.coupons        enable row level security;
alter table public.store_settings enable row level security;

-- Coupons: only an admin may list them. A customer never needs to browse the
-- set — they type a code, and validation happens server-side at checkout.
drop policy if exists "admin coupons" on public.coupons;
create policy "admin coupons" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- Settings drive prices shown in the storefront, so reads are public.
drop policy if exists "public read settings" on public.store_settings;
drop policy if exists "admin writes settings" on public.store_settings;
create policy "public read settings"  on public.store_settings for select using (true);
create policy "admin writes settings" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

insert into public.coupons (code, type, value, min_order, usage_limit, is_active) values
  ('WELCOME10', 'PERCENT',  10, 1499, 500,  true),
  ('FREESHIP',  'FREESHIP',  0,  499, null, true),
  ('FLAT200',   'FLAT',     200, 1999, 200,  true)
on conflict (code) do nothing;
