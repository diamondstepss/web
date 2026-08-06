-- Tracks whether the welcome email has been sent.
--
-- Guards against duplicates: a reloaded signup page, a retried request or two
-- tabs finishing at once must not mail the customer twice. The API claims this
-- column before sending and releases it if the send fails.

alter table public.profiles
  add column if not exists welcomed_at timestamptz;

comment on column public.profiles.welcomed_at is
  'When the welcome email was sent. Null means not yet sent; set before sending to claim it.';
