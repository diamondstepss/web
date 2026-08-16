-- "Pay online, pick up in store" — a second fulfillment path alongside home
-- delivery. Single-location for now (SITE.address on the client), so this is
-- just a flag on the order, not a store-locations table.
alter table public.orders
  add column if not exists fulfillment_type text not null default 'DELIVERY'
    check (fulfillment_type in ('DELIVERY', 'PICKUP'));
