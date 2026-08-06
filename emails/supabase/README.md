# Supabase auth email templates

Supabase sends the sign-in code, password reset and confirmation emails itself,
so it cannot import the TypeScript templates in `lib/email-template.ts`. These
are generated from the same design and left with Supabase's placeholders
(`{{ .Token }}`, `{{ .ConfirmationURL }}`) intact.

## Using them

**Supabase → Authentication → Email Templates.** Paste each file into the
matching template and save:

- `magic-link.html` — Magic Link / OTP  →  Supabase: "Magic Link"
- `recovery.html` — Password reset  →  Supabase: "Reset Password"
- `confirm-signup.html` — Confirm signup  →  Supabase: "Confirm signup"
- `email-change.html` — Email change  →  Supabase: "Change Email Address"
- `invite.html` — Invite  →  Supabase: "Invite user"

## Regenerating

Change the design in `scripts/build-email-templates.mjs`, then:

    node scripts/build-email-templates.mjs

and paste again. There is no way to have Supabase pull these automatically.

## These only reach Resend if SMTP is configured

Without custom SMTP, Supabase sends from its shared testing service, which is
rate-limited to a handful of emails an hour and is not for production. See
`RESEND_SETUP.md` for the SMTP settings.
