-- Newsletter subscribers.
--
-- The footer signup previously ran `alert('Thanks for subscribing!')` and kept
-- nothing, so every address entered since launch was lost. This gives it real
-- storage.
--
-- Consent fields are recorded because Indian bulk-email rules and every major
-- ESP expect you to be able to show when and from where someone opted in.

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source        text not null default 'footer',
  status        text not null default 'SUBSCRIBED',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,

  constraint newsletter_status_check check (status in ('SUBSCRIBED', 'UNSUBSCRIBED')),
  -- Case-insensitive uniqueness: Foo@x.com and foo@x.com are one person.
  constraint newsletter_email_lower check (email = lower(email))
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "admin reads subscribers" on public.newsletter_subscribers;
drop policy if exists "admin writes subscribers" on public.newsletter_subscribers;

-- No public read: the subscriber list is not something the anon key should be
-- able to enumerate. Inserts go through the API route on the service role.
create policy "admin reads subscribers"
  on public.newsletter_subscribers for select using (public.is_admin());

create policy "admin writes subscribers"
  on public.newsletter_subscribers for all
  using (public.is_admin()) with check (public.is_admin());
