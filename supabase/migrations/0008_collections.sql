-- Collections: curated groups of products that feed the homepage rails.
-- A category says what a product IS; a collection says where we're promoting it.

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  image       text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.product_collections (
  product_id    uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  position      integer not null default 0,
  primary key (product_id, collection_id)
);

alter table public.collections         enable row level security;
alter table public.product_collections enable row level security;

do $$
declare t text;
begin
  foreach t in array array['collections','product_collections'] loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I', t);
    execute format('drop policy if exists "admin writes %1$s" on public.%1$I', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (true)', t);
    execute format('create policy "admin writes %1$s" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

insert into public.collections (slug, name, description, position) values
  ('new-arrivals', 'New Arrivals', 'Freshest drops, first', 1),
  ('best-sellers', 'Best Sellers',  'What everyone is buying', 2),
  ('sale',         'Sale',          'Deepest discounts of the season', 3)
on conflict (slug) do nothing;

-- Seed each collection from what already qualifies.
insert into public.product_collections (product_id, collection_id)
select p.id, c.id from public.products p cross join public.collections c
where (c.slug = 'new-arrivals' and p.badge = 'NEW')
   or (c.slug = 'best-sellers' and p.is_featured)
   or (c.slug = 'sale' and public.product_discount(p.mrp, p.price) >= 29)
on conflict do nothing;
