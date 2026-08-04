-- Shop reviews.
--
-- Two sources, kept distinct on purpose:
--
--   GOOGLE — pulled from the Google Places API for the shop's own listing.
--            Verifiable: each row keeps the Google author and a link back, so
--            a visitor can check it against the real listing.
--
--   MANUAL — testimonials the shop chooses to feature. NOT independently
--            verifiable, so the UI must never present these as verified.
--
-- These are reviews of the BUSINESS, not of a product. Product-level ratings
-- are a separate thing and must not be derived from these, or the Product
-- structured data would be claiming ratings the products never received.

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  source        text not null default 'MANUAL',
  -- Google's review id, so a re-sync updates rather than duplicates.
  source_id     text,
  author        text not null,
  author_photo  text,
  location      text,
  rating        smallint not null,
  body          text not null,
  published_at  timestamptz not null default now(),
  -- Google reviews link back to the listing so anyone can verify them.
  source_url    text,
  is_published  boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint reviews_source_check check (source in ('GOOGLE', 'MANUAL')),
  constraint reviews_rating_check check (rating between 1 and 5)
);

-- One row per Google review; MANUAL rows have a null source_id and are exempt.
create unique index if not exists reviews_source_id_key
  on public.reviews (source, source_id) where source_id is not null;

create index if not exists reviews_published_idx
  on public.reviews (is_published, position, published_at desc);

alter table public.reviews enable row level security;

drop policy if exists "public read reviews" on public.reviews;
drop policy if exists "admin writes reviews" on public.reviews;

create policy "public read reviews"
  on public.reviews for select using (is_published);

create policy "admin writes reviews"
  on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- Carry over the three testimonials that were hardcoded in HomePage, at the
-- shop's request. They are MANUAL, so the UI labels them as the shop's own
-- selected testimonials rather than as verified Google reviews.
insert into public.reviews (source, author, location, rating, body, position, published_at)
values
  ('MANUAL', 'Ananya R.', 'Bengaluru', 5,
   'Got my Nike Air Force 1s in 2 days. Totally genuine — even the box and tags were perfect. Will definitely order again!', 1, now() - interval '30 days'),
  ('MANUAL', 'Rajan S.', 'Mumbai', 5,
   'Best prices I found anywhere online. Paid via COD, no issues at all. The size guide was super helpful.', 2, now() - interval '24 days'),
  ('MANUAL', 'Priya K.', 'Delhi', 4,
   'Ordered Chelsea boots — absolutely love them. Quick delivery, well-packaged. Slightly delayed but worth it.', 3, now() - interval '18 days')
on conflict do nothing;
