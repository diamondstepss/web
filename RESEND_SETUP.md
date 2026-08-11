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

## 3. Paste the auth templates into Supabase

Supabase renders its own emails, so it cannot use the TypeScript templates. Matching HTML is generated into [`emails/supabase/`](emails/supabase/) — paste each file into **Authentication → Email Templates**. See the [README](emails/supabase/README.md) there for which file goes where.

Regenerate them after any design change:

```bash
node scripts/build-email-templates.mjs
```

## 4. Add the API key for the app's own emails

Everything the app sends itself — welcome, order confirmation, shipped, delivered, cancelled, newsletter, contact — goes through the Resend API rather than SMTP.

```bash
# .env.local
RESEND_API_KEY=re_your_key_here
RESEND_FROM=Diamond Stepss <orders@diamondstepss.com>
```

`RESEND_API_KEY` has no `NEXT_PUBLIC_` prefix on purpose — it must never reach the browser. [`lib/email.ts`](lib/email.ts) imports `server-only`, so the build fails loudly if anyone ever imports it into a client component.

## 5. Confirm it works

Sign in at `/login`. The code should arrive within seconds, and the email will show your domain rather than Supabase's.

To check how any email looks without sending one, run the dev server and open **`/api/dev/emails`**. It lists every template and renders them through the same code the send path uses, so the preview cannot drift from what customers receive. The route returns 404 in production.

## What's wired

| Email | Sent by | Trigger |
|---|---|---|
| Sign-in code | Supabase (Resend SMTP) | `/login` |
| Password reset | Supabase (Resend SMTP) | "Forgot password" on `/login` |
| Confirm signup / email change / invite | Supabase (Resend SMTP) | Auth flows |
| Welcome | App (`sendWelcomeEmail`) | First sign-in after signup, via `POST /api/account/welcome` |
| Newsletter confirmation | App (`sendNewsletterWelcome`) | Footer signup |
| Order confirmation | App (`sendOrderConfirmation`) | Instamojo webhook |
| Shipped | App (`sendShippedEmail`) | Admin sets an order to SHIPPED |
| Delivered | App (`sendDeliveredEmail`) | Admin sets an order to DELIVERED |
| Cancelled | App (`sendCancelledEmail`) | Admin sets an order to CANCELLED |
| Contact enquiry | App (`sendContactMessage`) | `/contact` form, replies to the customer |

All of them share one design system ([`lib/email-template.ts`](lib/email-template.ts)): the shop's black masthead, red rule and Outfit headings, on a light body. Dark-mode email support is inconsistent enough across clients that a dark body renders as unreadable grey in several of them, and a receipt is the wrong place to gamble on that.

The order confirmation highlights the **balance due on delivery** for partial-COD orders — the number customers most need to see before the courier arrives.

Two rules the send paths follow:

- **A failed email never fails the action.** The subscription is saved, the order status is recorded, the account is created — a mail outage is logged, not surfaced. The exception is the contact form, which throws, because it tells the visitor their message was sent.
- **The welcome email sends once**, claimed via `profiles.welcomed_at` before sending, so a reload or a retry cannot mail the customer twice.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Still rate limited | Custom SMTP not enabled, or the auth rate limit still at its default |
| Emails land in spam | Domain not verified, or SPF/DKIM records not propagated yet |
| `535 Authentication failed` | Username must be `resend`, password must be the API key |
| A magic link arrives instead of a 6-digit code | Turn **Confirm email** off in Auth → Providers → Email |
