-- Let the admin list orders with their customer in one query.
--
-- orders.user_id and profiles.id both point at auth.users(id), but PostgREST
-- can only embed across a declared foreign key — without this, a request for
-- `orders?select=*,profiles(...)` fails with 400.
--
-- Safe to add: profiles.id is the primary key and a row is created for every
-- user by the on_auth_user_created trigger, so it always exists before an
-- order can reference it.

alter table public.orders
  drop constraint if exists orders_user_id_profiles_fkey;

alter table public.orders
  add constraint orders_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Same for addresses, so the admin can show a delivery address alongside an order.
alter table public.addresses
  drop constraint if exists addresses_user_id_profiles_fkey;

alter table public.addresses
  add constraint addresses_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
