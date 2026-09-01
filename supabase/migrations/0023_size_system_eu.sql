-- Switches the shop's master size scale from UK to EU. Every product's sizes
-- and per-size stock were entered in UK (6-11) — this rewrites them in place
-- to their EU equivalents (per data/sizes.ts's conversion table) so EU becomes
-- the real stored data, not just a display label.
--
-- order_items.size is deliberately left untouched: it's a snapshot of what was
-- actually sold at the time, in the size system that was live then. Rewriting
-- history would make past receipts and invoices lie about what was ordered.
--
-- The mapping below only covers 6-11 because that's the complete range ever
-- used in this catalog (verified against the live products and
-- product_size_stock tables before writing this migration) — anything outside
-- it is passed through unchanged rather than silently dropped.

alter table public.store_settings
  add column if not exists size_system text not null default 'EU'
    check (size_system in ('UK', 'EU', 'US'));

update public.products
   set sizes = array(
     select case s
       when '6'  then '39'
       when '7'  then '40.5'
       when '8'  then '42'
       when '9'  then '43'
       when '10' then '44.5'
       when '11' then '46'
       else s
     end
     from unnest(sizes) as s
   )
 where cardinality(sizes) > 0;

update public.product_size_stock
   set size = case size
     when '6'  then '39'
     when '7'  then '40.5'
     when '8'  then '42'
     when '9'  then '43'
     when '10' then '44.5'
     when '11' then '46'
     else size
   end
 where size in ('6', '7', '8', '9', '10', '11');
