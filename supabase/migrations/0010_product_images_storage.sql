-- Storage for product photography.
--
-- Public bucket: product images are meant to be seen, and a public bucket lets
-- next/image and the CDN cache them without signed-URL round trips.
-- Writes stay admin-only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,                                    -- 5 MB per file
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read product images"   on storage.objects;
drop policy if exists "admin writes product images"  on storage.objects;
drop policy if exists "admin deletes product images" on storage.objects;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admin writes product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin deletes product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- Cap the gallery at five images per product, enforced in the database so the
-- UI is not the only thing holding the line.
create or replace function public.enforce_media_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.product_media where product_id = new.product_id) >= 5 then
    raise exception 'A product can have at most 5 images';
  end if;
  return new;
end $$;

drop trigger if exists product_media_limit on public.product_media;
create trigger product_media_limit
  before insert on public.product_media
  for each row execute function public.enforce_media_limit();
