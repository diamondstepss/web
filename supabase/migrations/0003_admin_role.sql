-- Admin role.
--
-- Two halves, and both are needed:
--   1. a flag so the app can decide who may open /admin
--   2. RLS policies so an admin can actually read other customers' rows —
--      without these, an admin opens the panel and sees only their own orders.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

/**
 * SECURITY DEFINER so the policies below can call it without re-triggering
 * RLS on profiles — a policy on profiles that reads profiles would recurse.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── Admin read/write across customer data ───────────────────────────────────
-- These sit alongside the existing "own row" policies. Postgres ORs policies
-- together, so a customer keeps their own access and an admin gains the rest.

drop policy if exists "admin reads all profiles"   on public.profiles;
drop policy if exists "admin reads all orders"     on public.orders;
drop policy if exists "admin updates all orders"   on public.orders;
drop policy if exists "admin reads all items"      on public.order_items;
drop policy if exists "admin reads all addresses"  on public.addresses;

create policy "admin reads all profiles"  on public.profiles    for select using (public.is_admin());
create policy "admin reads all orders"    on public.orders      for select using (public.is_admin());
create policy "admin updates all orders"  on public.orders      for update using (public.is_admin());
create policy "admin reads all items"     on public.order_items for select using (public.is_admin());
create policy "admin reads all addresses" on public.addresses   for select using (public.is_admin());

-- Nobody may promote themselves: is_admin is only ever set by a service-role
-- connection (a migration, or the SQL editor), never through the API.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- ── Grant admin to the store owner ──────────────────────────────────────────
-- Deliberately NOT the demo account: its password ships in client JS.
update public.profiles
   set is_admin = true
 where id = (select id from auth.users where email = 'neuceptionsolutions@gmail.com');
