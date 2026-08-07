-- ── Stock, per size ──────────────────────────────────────────────────────────
--
-- Until now `products.stock` was one number for the whole product — a shoe
-- with 12 pairs in stock had no way to say 4 of those were UK 8 and 0 were
-- UK 11. The storefront picker let a customer choose any listed size
-- regardless of what was actually left, and the checkout stock check only
-- ever looked at the total.
--
-- This adds real per-size stock for footwear. Accessories (an empty `sizes`
-- array) are untouched — a watch has no size to track separately, so it keeps
-- using `products.stock` directly, exactly as before.
create table if not exists public.product_size_stock (
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      integer not null default 0 check (stock >= 0),
  primary key (product_id, size)
);

alter table public.product_size_stock enable row level security;

drop policy if exists "public read size stock" on public.product_size_stock;
drop policy if exists "admin writes size stock" on public.product_size_stock;

create policy "public read size stock" on public.product_size_stock
  for select using (true);

create policy "admin writes size stock" on public.product_size_stock
  for all using (public.is_admin()) with check (public.is_admin());

/**
 * Keeps `products.stock` equal to the sum of its sizes, for every product
 * that has any. This is what every existing "is it out of stock" read
 * (the products list, the storefront badge, the checkout total-stock
 * fallback) already checks — recomputing it here means none of that code had
 * to learn about the new table to keep working.
 *
 * A product with zero rows here — an accessory, a footwear product that
 * hasn't been migrated yet, or one whose last size row was just deleted
 * (the admin converting it from footwear to an accessory) — is left alone.
 * Forcing `products.stock` to zero the moment the last row disappears would
 * clobber the direct stock number the admin is about to manage by hand
 * instead; better to simply stop touching it once there is nothing left to
 * sum.
 */
create or replace function public.sync_product_stock_from_sizes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
  total integer;
  remaining integer;
begin
  select coalesce(sum(stock), 0), count(*) into total, remaining
    from public.product_size_stock where product_id = pid;

  if remaining = 0 then
    return null;
  end if;

  update public.products set stock = total where id = pid;
  return null;
end $$;

drop trigger if exists product_size_stock_sync on public.product_size_stock;
create trigger product_size_stock_sync
  after insert or update or delete on public.product_size_stock
  for each row execute function public.sync_product_stock_from_sizes();

/**
 * Seeds a zero-stock row for every size every existing footwear product
 * already lists, so the admin has something to edit instead of an empty
 * table. Deliberately zero, not the product's current total split or
 * copied across sizes — either of those would be a fabricated number
 * presented as real inventory. Zero is honest: these products go out of
 * stock, in every size, until the real counts are entered. See the
 * migration's commit message for why that trade was made on purpose.
 */
insert into public.product_size_stock (product_id, size, stock)
select p.id, s, 0
from public.products p, unnest(p.sizes) as s
where cardinality(p.sizes) > 0
on conflict (product_id, size) do nothing;

-- ── Atomic per-size decrement ────────────────────────────────────────────────
--
-- A second overload of decrement_stock, resolved by PostgREST from the
-- argument names the checkout route sends: p_size present → this one; absent
-- → the original two-argument version, still used for accessories.
create or replace function public.decrement_stock(p_slug text, p_size text, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  select id into pid from public.products where slug = p_slug;
  if pid is null then
    return;
  end if;

  update public.product_size_stock
     set stock = greatest(stock - p_qty, 0)
   where product_id = pid and size = p_size;
  -- products.stock recomputes via the trigger above.
end $$;

revoke all on function public.decrement_stock(text, text, integer) from public, authenticated, anon;
