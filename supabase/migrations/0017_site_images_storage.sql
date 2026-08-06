-- Storage for artwork that is not a product photograph.
--
-- Category covers, collection covers and generated banners. A separate bucket
-- from product-images on purpose: the Media page's orphan scan treats anything
-- in product-images with no product_media row as junk to be deleted, and a
-- category cover has no such row. Putting them together would mean the cleanup
-- tool offering to delete every category image on the site.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  5242880,                                    -- 5 MB, same as product images
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read site images"   on storage.objects;
drop policy if exists "admin writes site images"  on storage.objects;
drop policy if exists "admin deletes site images" on storage.objects;

create policy "public read site images" on storage.objects
  for select using (bucket_id = 'site-images');

create policy "admin writes site images" on storage.objects
  for insert with check (bucket_id = 'site-images' and public.is_admin());

create policy "admin deletes site images" on storage.objects
  for delete using (bucket_id = 'site-images' and public.is_admin());
