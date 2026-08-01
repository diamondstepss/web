-- Homepage sections: the ordered strips that make up the storefront home page.
--
-- The admin "Section builder" previously ran on a hardcoded array, so nothing
-- an admin did there survived a reload. This gives it real storage.
--
-- `source` decides where a PRODUCT_RAIL gets its items from; `source_slug`
-- points at the collection or category when the source needs one.

create table if not exists public.homepage_sections (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'PRODUCT_RAIL',
  title       text not null,
  subtitle    text,
  source      text not null default 'FEATURED',
  source_slug text,
  item_limit  integer not null default 8,
  position    integer not null default 0,
  is_visible  boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),

  constraint homepage_sections_type_check check (
    type in ('HERO_SLIDER','USP_STRIP','PRODUCT_RAIL','CATEGORY_TILES',
             'VIDEO_HERO','BRAND_STRIP','SPLIT_BANNER','NEWSLETTER')
  ),
  constraint homepage_sections_source_check check (
    source in ('FEATURED','COLLECTION','CATEGORY','SALE','NEWEST','MANUAL')
  ),
  constraint homepage_sections_limit_check check (item_limit between 1 and 24)
);

create index if not exists homepage_sections_position_idx
  on public.homepage_sections (position);

alter table public.homepage_sections enable row level security;

drop policy if exists "public read homepage_sections" on public.homepage_sections;
drop policy if exists "admin writes homepage_sections" on public.homepage_sections;

-- The storefront reads this with the anon key, so reads stay open.
create policy "public read homepage_sections"
  on public.homepage_sections for select using (true);

create policy "admin writes homepage_sections"
  on public.homepage_sections for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed with the layout the homepage already renders, so the builder opens on
-- the real current page rather than an empty list.
insert into public.homepage_sections (type, title, source, source_slug, item_limit, position, is_visible)
values
  ('HERO_SLIDER',    'Main hero slider',          'MANUAL',     null,            1,  1,  true),
  ('USP_STRIP',      'Trust strip',               'MANUAL',     null,            1,  2,  true),
  ('PRODUCT_RAIL',   'Best discounts this week',  'SALE',       null,            8,  3,  true),
  ('CATEGORY_TILES', 'Shop by category',          'MANUAL',     null,            6,  4,  true),
  ('PRODUCT_RAIL',   'New arrivals',              'COLLECTION', 'new-arrivals',  8,  5,  true),
  ('BRAND_STRIP',    'Brand logos',               'MANUAL',     null,            1,  6,  true),
  ('PRODUCT_RAIL',   'Best sellers',              'COLLECTION', 'best-sellers',  8,  7,  true),
  ('VIDEO_HERO',     'AW25 campaign video',       'MANUAL',     null,            1,  8,  false),
  ('SPLIT_BANNER',   'Men''s & women''s edit',    'MANUAL',     null,            2,  9,  true)
on conflict do nothing;
