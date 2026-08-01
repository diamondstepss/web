-- Optional: gives a freshly signed-up account some sample orders and an address
-- so the account page isn't empty while you're still demoing.
--
-- The app calls this once per user via `supabase.rpc('seed_demo_data')`.
-- Delete this migration before go-live — real orders come from checkout.

create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  o1  uuid;
  o2  uuid;
  o3  uuid;
begin
  if uid is null then
    raise exception 'must be signed in';
  end if;

  -- Idempotent: never seed an account that already has orders.
  if exists (select 1 from public.orders where user_id = uid) then
    return;
  end if;

  insert into public.addresses (user_id, label, name, phone, line1, city, state, pincode, is_default)
  values (uid, 'HOME', 'Rajesh Kumar', '+91 98765 43210',
          '204, Green Enclave, Model Town Road', 'Jalandhar', 'Punjab', '144003', true);

  -- Delivered, paid online
  insert into public.orders (user_id, order_number, status, payment_mode, payment_status,
                             subtotal, total, amount_paid_online, amount_due_on_delivery,
                             courier, awb, placed_at)
  values (uid, 'DS-2026-004821', 'DELIVERED', 'PREPAID', 'PAID',
          1499, 1499, 1499, 0, 'Delhivery', '341988275510', now() - interval '12 days')
  returning id into o1;

  insert into public.order_items (order_id, product_id, brand, title, size, qty, price, image) values
    (o1, '1', 'Nike', 'Air Force 1 Low White', 'UK 9', 1, 1499,
     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format');

  -- In transit, partial COD — the interesting case
  insert into public.orders (user_id, order_number, status, payment_mode, payment_status,
                             subtotal, total, amount_paid_online, amount_due_on_delivery,
                             courier, awb, placed_at)
  values (uid, 'DS-2026-004756', 'SHIPPED', 'PARTIAL_COD', 'PAID',
          2499, 2499, 300, 2199, 'Bluedart', '7712004399 81', now() - interval '6 days')
  returning id into o2;

  insert into public.order_items (order_id, product_id, brand, title, size, qty, price, image) values
    (o2, '2', 'Adidas', 'Ultraboost 22 Running Shoes', 'UK 8', 1, 2499,
     'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop&auto=format');

  -- Cancelled COD
  insert into public.orders (user_id, order_number, status, payment_mode, payment_status,
                             subtotal, cod_fee, total, amount_paid_online, amount_due_on_delivery,
                             placed_at)
  values (uid, 'DS-2026-004700', 'CANCELLED', 'COD', 'PENDING',
          1299, 49, 1348, 0, 1348, now() - interval '20 days')
  returning id into o3;

  insert into public.order_items (order_id, product_id, brand, title, size, qty, price, image) values
    (o3, '3', 'Puma', 'RS-X Puzzle Sneakers', 'UK 10', 1, 1299,
     'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&auto=format');

  insert into public.wishlist (user_id, product_id)
  values (uid, '4'), (uid, '5')
  on conflict do nothing;
end $$;

revoke all on function public.seed_demo_data() from public;
grant execute on function public.seed_demo_data() to authenticated;
