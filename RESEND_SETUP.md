# Resend setup

Fixes the `over_email_send_rate_limit` error on sign-in, and gives you order emails from your own domain.

## Why

Supabase's built-in SMTP is a shared testing service capped at a handful of emails per hour. You hit that cap while testing sign-in:

```
{"code":429,"error_code":"over_email_send_rate_limit",
 "msg":"For security purposes, you can only request this after 22 seconds."}
```

It is not meant for production and Supabase will not lift it. Pointing Supabase at your own SMTP removes the cap entirely.

## 1. Create the account and verify the domain

1. Sign up at [resend.com](https://resend.com).
2. **Domains → Add Domain** → `diamondstepss.com`.
3. Add the DNS records Resend gives you (an MX record and two or three TXT records for SPF/DKIM) at your domain registrar. Verification usually completes in minutes.

Skipping domain verification means you can only send to your own address, and anything you do send lands in spam.

## 2. Point Supabase at Resend

Supabase sends the sign-in OTP, so it needs the SMTP credentials — not the API key.

**Supabase → Project Settings → Authentication → SMTP Settings → Enable Custom SMTP**

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend **API key** (`re_…`) |
| Sender email | `noreply@diamondstepss.com` |
| Sender name | `Diamond Stepss` |

Username is the literal string `resend` — not your email address. That trips most people up.

While you're in the Auth settings, also raise **Rate Limits → Emails per hour**; it stays at the low default even after you connect your own SMTP.

## 3. Add the API key for order emails

Order confirmations and shipping notifications are sent by the app, not Supabase, so they use the API directly.

```bash
# .env.local
RESEND_API_KEY=re_your_key_here
RESEND_FROM=Diamond Stepss <orders@diamondstepss.com>
```

`RESEND_API_KEY` has no `NEXT_PUBLIC_` prefix on purpose — it must never reach the browser. [`lib/email.ts`](lib/email.ts) imports `server-only`, so the build fails loudly if anyone ever imports it into a client component.

## 4. Confirm it works

Sign in at `/login`. The code should arrive within seconds, and the email will show your domain rather than Supabase's.

## What's wired

| Email | Sent by | Trigger | Status |
|---|---|---|---|
| Sign-in OTP | Supabase (via Resend SMTP) | `/login` | Works once step 2 is done |
| Order confirmation | App (`sendOrderConfirmation`) | Cashfree webhook | Written, not yet called — checkout doesn't create orders |
| Shipped notification | App (`sendShippedEmail`) | Shiprocket webhook | Same |

Both order emails render the order in the store's colours, and the confirmation highlights the **balance due on delivery** for partial-COD orders — the number customers most need to see before the courier arrives.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Still rate limited | Custom SMTP not enabled, or the auth rate limit still at its default |
| Emails land in spam | Domain not verified, or SPF/DKIM records not propagated yet |
| `535 Authentication failed` | Username must be `resend`, password must be the API key |
| A magic link arrives instead of a 6-digit code | Turn **Confirm email** off in Auth → Providers → Email |
