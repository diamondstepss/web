-- The prepaid discount was assumed to always be a percentage. It's actually
-- meant to be a flat ₹ amount ("₹30 off", not "30% off") — this makes that
-- configurable instead of hardcoding one or the other. The existing
-- prepaid_discount_pct column is kept (avoids a rename + dual-read fallback
-- during deploy) and now holds either a percent or a rupee figure depending
-- on this new type column.

alter table public.store_settings
  add column if not exists prepaid_discount_type text not null default 'PERCENT'
    check (prepaid_discount_type in ('PERCENT', 'FLAT'));

-- Guarded the same way 0020 was: only fires while still at the default this
-- migration itself introduces, so a later admin edit is never stomped on by
-- a re-run of this script.
update public.store_settings
   set prepaid_discount_type = 'FLAT'
 where id = true
   and prepaid_discount_type = 'PERCENT'
   and prepaid_discount_pct = 30
   and prepaid_discount_min_order = 1499;
