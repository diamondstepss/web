-- Switching payment gateway from Cashfree to Instamojo.
--
-- Cashfree let us set our own order_number as its own order id, so its webhook
-- could look orders up directly. Instamojo's Payment Requests API returns its
-- own payment_request_id instead — this column persists it at creation time so
-- the webhook can correlate back to the order.
alter table public.orders add column if not exists gateway_payment_request_id text;
create index if not exists orders_gateway_payment_request_id_idx on public.orders(gateway_payment_request_id);

-- Mirrors decrement_stock (0009, 0018). Needed so that when payment-request
-- creation fails, the checkout route can roll back the stock it just reserved
-- instead of leaving a confirmed-but-unpaid order behind.
create or replace function public.increment_stock(p_slug text, p_qty integer)
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

  update public.products set stock = stock + p_qty where id = pid;
end $$;

revoke all on function public.increment_stock(text, integer) from public, authenticated, anon;

create or replace function public.increment_stock(p_slug text, p_size text, p_qty integer)
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
     set stock = stock + p_qty
   where product_id = pid and size = p_size;
  -- products.stock recomputes via the trigger from 0018.
end $$;

revoke all on function public.increment_stock(text, text, integer) from public, authenticated, anon;
