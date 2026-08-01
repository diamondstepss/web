-- Atomic helpers used by the checkout route.
--
-- Doing these as read-then-write from the app would race: two customers
-- buying the last pair could both read stock = 1 and both succeed.

create or replace function public.decrement_stock(p_slug text, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
     set stock = greatest(stock - p_qty, 0)
   where slug = p_slug;
end $$;

create or replace function public.increment_coupon_use(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
     set used_count = used_count + 1
   where code = p_code;
end $$;

-- Only the service role (the checkout route) may call these.
revoke all on function public.decrement_stock(text, integer) from public, authenticated, anon;
revoke all on function public.increment_coupon_use(text) from public, authenticated, anon;
