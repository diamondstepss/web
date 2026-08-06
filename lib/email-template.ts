import 'server-only'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

/**
 * Email design system.
 *
 * Email HTML is not web HTML. Outlook renders through Word, Gmail strips
 * <style> in some contexts, and flexbox/grid are unreliable everywhere. So:
 * tables for layout, inline styles for everything, no external CSS.
 *
 * The look mirrors the storefront — black header band, red accent, Outfit for
 * headings — but on a light body. Dark-mode email support is inconsistent
 * enough that a dark body renders as unreadable grey in several clients, and a
 * customer receipt is the wrong place to gamble on that.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'

/**
 * Where email images are loaded from.
 *
 * Deliberately separate from SITE_URL. diamondstepss.com still serves the old
 * WordPress site, so /brand/wide-logo.png 404s there — pointing emails at it
 * would put a broken image at the top of every message the shop sends. The
 * Vercel URL is where the asset actually lives today. Once DNS moves, set
 * EMAIL_ASSET_BASE to the apex domain and nothing else changes.
 *
 * The image must already be deployed. A newly added asset that exists only on
 * a developer's machine renders as alt text in every inbox it reaches.
 */
const ASSET_BASE = (
  process.env.EMAIL_ASSET_BASE ?? 'https://web-theta-five-69.vercel.app'
).replace(/\/+$/, '')

export const C = {
  ink: '#1a1a1a',
  body: '#4a4a4a',
  muted: '#767676',
  accent: '#e02020',
  line: '#e6e6e6',
  panel: '#fafafa',
  page: '#f2f2f2',
  black: '#000000',
  success: '#0f8a4a',
} as const

/** Outfit if the client supports webfonts; a sane stack when it doesn't. */
const DISPLAY = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif"
const BODY = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export const inr = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`

/** Escapes anything interpolated into the HTML. */
export const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function button(label: string, href: string): string {
  // A table, not an <a> with padding — Outlook ignores padding on inline links.
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0">
    <tr><td align="center" bgcolor="${C.accent}" style="border-radius:999px">
      <a href="${href}" style="display:inline-block;padding:14px 34px;font-family:${DISPLAY};font-size:13px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr>
  </table>`
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 14px;font-family:${DISPLAY};font-size:25px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:${C.ink}">${esc(text)}</h1>`
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${BODY};font-size:15px;line-height:1.62;color:${C.body}">${html}</p>`
}

export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:22px 0"><div style="height:1px;background:${C.line};line-height:1px;font-size:0">&nbsp;</div></td></tr></table>`
}

/** Boxed panel for order summaries, addresses and the like. */
export function panel(inner: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};border:1px solid ${C.line};border-radius:10px">
    <tr><td style="padding:18px 20px">${inner}</td></tr>
  </table>`
}

/** Label/value row. `strong` is for the total line. */
export function row(label: string, value: string, opts: { strong?: boolean; tint?: string } = {}): string {
  const size = opts.strong ? '16px' : '14px'
  const weight = opts.strong ? '800' : '400'
  return `
  <tr>
    <td style="padding:5px 0;font-family:${BODY};font-size:${size};color:${opts.strong ? C.ink : C.muted};font-weight:${opts.strong ? '700' : '400'}">${esc(label)}</td>
    <td align="right" style="padding:5px 0;font-family:${BODY};font-size:${size};font-weight:${weight};color:${opts.tint ?? C.ink}">${value}</td>
  </tr>`
}

export interface ShellOptions {
  /** Shown in the inbox preview line, after the subject. */
  preheader: string
  /** Small uppercase label above the heading. */
  eyebrow?: string
}

/**
 * The wrapper every email shares.
 *
 * 600px is the widest that survives Outlook's reading pane without scaling.
 */
export function shell(body: string, { preheader, eyebrow }: ShellOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(SITE.name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-font-smoothing:antialiased">

<!-- Preview text: shown beside the subject, then hidden. The spacer stops the
     client filling the preview with whatever text comes next. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(preheader)}</div>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}">
  <tr><td align="center" style="padding:30px 14px">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${C.line}">

      <!-- Masthead: the real wordmark, on white.
           Not on the site's black bar: the "Stepss" script is black, and it
           disappears against it. The site gets away with inverting it in CSS;
           email has no filters, so the band is light instead.
           The alt text is the brand name, so a client that blocks images still
           shows something a customer recognises rather than a broken icon. -->
      <tr><td align="left" style="background:#ffffff;padding:14px 28px 10px">
        <a href="${SITE_URL}" style="text-decoration:none">
          <img src="${ASSET_BASE}/brand/wide-logo.png" alt="Diamond Stepss"
               width="200" height="98"
               style="display:block;border:0;outline:none;width:200px;height:auto;max-width:200px;font-family:${DISPLAY};font-size:21px;font-weight:800;color:${C.accent}">
        </a>
      </td></tr>

      <!-- A thin accent rule under the masthead -->
      <tr><td style="height:3px;background:${C.accent};line-height:3px;font-size:0">&nbsp;</td></tr>

      <tr><td style="padding:32px 28px 28px">
        ${eyebrow ? `<p style="margin:0 0 10px;font-family:${DISPLAY};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent}">${esc(eyebrow)}</p>` : ''}
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:${C.panel};border-top:1px solid ${C.line};padding:22px 28px">
        <p style="margin:0 0 8px;font-family:${BODY};font-size:12px;line-height:1.55;color:${C.muted}">
          ${esc(ADDRESS_ONE_LINE)}
        </p>
        <p style="margin:0 0 14px;font-family:${BODY};font-size:12px;color:${C.muted}">
          <a href="${SITE.phoneHref}" style="color:${C.accent};text-decoration:none">${esc(SITE.phone)}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${SITE.email}" style="color:${C.accent};text-decoration:none">${esc(SITE.email)}</a>
        </p>
        <p style="margin:0;font-family:${BODY};font-size:11px;color:${C.muted}">
          <a href="${SITE_URL}/order-tracking" style="color:${C.muted};text-decoration:underline">Track an order</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}/return-policy" style="color:${C.muted};text-decoration:underline">Returns</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}/contact" style="color:${C.muted};text-decoration:underline">Contact</a>
        </p>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-family:${BODY};font-size:11px;color:${C.muted}">
      © ${new Date().getFullYear()} ${esc(SITE.name)}. ${esc(SITE.address.city)}, ${esc(SITE.address.state)}.
    </p>

  </td></tr>
</table>
</body>
</html>`
}

export { SITE_URL, DISPLAY, BODY }
