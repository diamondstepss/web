-- The prepaid discount used to apply flatly to every online-paid order,
-- regardless of size. This adds a minimum order value it must clear, and
-- raises the discount itself now that it's gated instead of unconditional.

alter table public.store_settings
  add column if not exists prepaid_discount_min_order numeric(10,2) not null default 0;

-- This script re-runs every migration on every deploy (no migration-tracking
-- table), so the value change is guarded to fire once: only while both
-- columns still sit at their prior defaults. Once an admin edits either from
-- Shipping & payment, a later re-run of this file must not stomp on that.
update public.store_settings
   set prepaid_discount_pct = 30,
       prepaid_discount_min_order = 1499
 where id = true
   and prepaid_discount_pct = 5
   and prepaid_discount_min_order = 0;
