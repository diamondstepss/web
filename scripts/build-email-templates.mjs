/**
 * Renders the Supabase auth email templates from the shared design.
 *
 * Supabase sends these itself, so they can't import our TypeScript at runtime.
 * This writes them out as static HTML with Supabase's {{ .Token }} style
 * placeholders left intact, ready to paste into
 * Supabase → Authentication → Email Templates.
 *
 *   node scripts/build-email-templates.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const SITE = {
  name: 'Diamond Stepss',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://diamondstepss.com',
  email: 'support@diamondstepss.com',
  phone: '+91 78885 22353',
  phoneHref: 'tel:+917888522353',
  address: 'Shop No. 3, Ladhewali Rd, near Suman Day School, Gulmarg Avenue, Jalandhar 144005, Punjab, India',
  city: 'Jalandhar',
  state: 'Punjab',
}

// Images cannot come from SITE.url: diamondstepss.com still serves the old
// WordPress site, so /brand/wide-logo.png 404s there and every auth email
// would open with a broken image. Point EMAIL_ASSET_BASE at the apex domain
// once DNS moves to Vercel.
const ASSET_BASE = (
  process.env.EMAIL_ASSET_BASE || 'https://web-theta-five-69.vercel.app'
).replace(/\/+$/, '')

const C = { ink:'#1a1a1a', body:'#4a4a4a', muted:'#767676', accent:'#e02020',
            line:'#e6e6e6', panel:'#fafafa', page:'#f2f2f2', black:'#000000' }
const DISPLAY = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif"
const BODY = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const shell = (body, { preheader, eyebrow }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${SITE.name}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}</div>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}">
  <tr><td align="center" style="padding:30px 14px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${C.line}">
      <tr><td align="left" style="background:#ffffff;padding:14px 28px 10px">
        <a href="${SITE.url}" style="text-decoration:none">
          <img src="${ASSET_BASE}/brand/wide-logo.png" alt="Diamond Stepss"
               width="200" height="98"
               style="display:block;border:0;outline:none;width:200px;height:auto;max-width:200px;font-family:${DISPLAY};font-size:21px;font-weight:800;color:${C.accent}">
        </a>
      </td></tr>
      <tr><td style="height:3px;background:${C.accent};line-height:3px;font-size:0">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 28px">
        ${eyebrow ? `<p style="margin:0 0 10px;font-family:${DISPLAY};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent}">${eyebrow}</p>` : ''}
        ${body}
      </td></tr>
      <tr><td style="background:${C.panel};border-top:1px solid ${C.line};padding:22px 28px">
        <p style="margin:0 0 8px;font-family:${BODY};font-size:12px;line-height:1.55;color:${C.muted}">${SITE.address}</p>
        <p style="margin:0;font-family:${BODY};font-size:12px;color:${C.muted}">
          <a href="${SITE.phoneHref}" style="color:${C.accent};text-decoration:none">${SITE.phone}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${SITE.email}" style="color:${C.accent};text-decoration:none">${SITE.email}</a>
        </p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-family:${BODY};font-size:11px;color:${C.muted}">© ${new Date().getFullYear()} ${SITE.name}. ${SITE.city}, ${SITE.state}.</p>
  </td></tr>
</table>
</body></html>`

const h1 = (t) => `<h1 style="margin:0 0 14px;font-family:${DISPLAY};font-size:25px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:${C.ink}">${t}</h1>`
const p  = (t) => `<p style="margin:0 0 16px;font-family:${BODY};font-size:15px;line-height:1.62;color:${C.body}">${t}</p>`
const btn = (label, href) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0">
    <tr><td align="center" bgcolor="${C.accent}" style="border-radius:999px">
      <a href="${href}" style="display:inline-block;padding:14px 34px;font-family:${DISPLAY};font-size:13px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a>
    </td></tr></table>`

/** The one-time code, shown big and monospaced so it is easy to copy. */
const codeBlock = (token) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr><td align="center" style="background:${C.panel};border:1px solid ${C.line};border-radius:10px;padding:22px">
      <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:0.24em;color:${C.ink}">${token}</div>
      <div style="margin-top:8px;font-family:${BODY};font-size:12px;color:${C.muted}">Expires in 60 minutes</div>
    </td></tr>
  </table>`

const security = (line) =>
  p(`<span style="font-size:13px;color:${C.muted}">${line}</span>`)

const TEMPLATES = {
  'magic-link': {
    label: 'Magic Link / OTP  →  Supabase: "Magic Link"',
    html: shell(
      `${h1('Your sign-in code')}
       ${p('Enter this code to sign in to your account.')}
       ${codeBlock('{{ .Token }}')}
       ${security('If you did not try to sign in, you can ignore this email — nobody can get in without the code.')}`,
      { eyebrow: 'Sign in', preheader: 'Your one-time sign-in code for Diamond Stepss.' },
    ),
  },
  'recovery': {
    label: 'Password reset  →  Supabase: "Reset Password"',
    html: shell(
      `${h1('Reset your password')}
       ${p('Use the button below to choose a new password. The link works once and expires in 60 minutes.')}
       ${btn('Choose a new password', '{{ .ConfirmationURL }}')}
       ${p(`<span style="font-size:13px;color:${C.muted}">Button not working? Paste this into your browser:<br><span style="word-break:break-all;color:${C.accent}">{{ .ConfirmationURL }}</span></span>`)}
       ${security('If you did not ask to reset your password, ignore this email — your current password still works and nothing has changed.')}`,
      { eyebrow: 'Password reset', preheader: 'Choose a new password. This link expires in 60 minutes.' },
    ),
  },
  'confirm-signup': {
    label: 'Confirm signup  →  Supabase: "Confirm signup"',
    html: shell(
      `${h1('Confirm your email')}
       ${p('One tap and your Diamond Stepss account is ready.')}
       ${btn('Confirm my email', '{{ .ConfirmationURL }}')}
       ${p(`<span style="font-size:13px;color:${C.muted}">Button not working? Paste this into your browser:<br><span style="word-break:break-all;color:${C.accent}">{{ .ConfirmationURL }}</span></span>`)}
       ${security('If you did not create an account, you can ignore this email.')}`,
      { eyebrow: 'Confirm your account', preheader: 'One tap to activate your Diamond Stepss account.' },
    ),
  },
  'email-change': {
    label: 'Email change  →  Supabase: "Change Email Address"',
    html: shell(
      `${h1('Confirm your new email')}
       ${p('You asked to change the email address on your Diamond Stepss account. Confirm it below.')}
       ${btn('Confirm new address', '{{ .ConfirmationURL }}')}
       ${security('If this was not you, ignore this email and contact us — your account still uses the old address.')}`,
      { eyebrow: 'Email change', preheader: 'Confirm the new address on your account.' },
    ),
  },
  'invite': {
    label: 'Invite  →  Supabase: "Invite user"',
    html: shell(
      `${h1('You have been invited')}
       ${p(`You have been invited to create an account on ${SITE.name}.`)}
       ${btn('Accept the invite', '{{ .ConfirmationURL }}')}
       ${security('If you were not expecting this, you can safely ignore it.')}`,
      { eyebrow: 'Invitation', preheader: `An invitation to join ${SITE.name}.` },
    ),
  },
}

const outDir = path.join(process.cwd(), 'emails', 'supabase')
fs.mkdirSync(outDir, { recursive: true })
const index = []
for (const [name, t] of Object.entries(TEMPLATES)) {
  fs.writeFileSync(path.join(outDir, `${name}.html`), t.html)
  index.push(`- \`${name}.html\` — ${t.label}`)
  console.log(`  wrote emails/supabase/${name}.html`)
}
fs.writeFileSync(path.join(outDir, 'README.md'),
`# Supabase auth email templates

Supabase sends the sign-in code, password reset and confirmation emails itself,
so it cannot import the TypeScript templates in \`lib/email-template.ts\`. These
are generated from the same design and left with Supabase's placeholders
(\`{{ .Token }}\`, \`{{ .ConfirmationURL }}\`) intact.

## Using them

**Supabase → Authentication → Email Templates.** Paste each file into the
matching template and save:

${index.join('\n')}

## Regenerating

Change the design in \`scripts/build-email-templates.mjs\`, then:

    node scripts/build-email-templates.mjs

and paste again. There is no way to have Supabase pull these automatically.

## These only reach Resend if SMTP is configured

Without custom SMTP, Supabase sends from its shared testing service, which is
rate-limited to a handful of emails an hour and is not for production. See
\`RESEND_SETUP.md\` for the SMTP settings.
`)
console.log('  wrote emails/supabase/README.md')
