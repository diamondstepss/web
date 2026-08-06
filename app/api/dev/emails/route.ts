import { NextResponse, type NextRequest } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  renderWelcomeEmail,
  renderNewsletterWelcome,
  renderOrderConfirmation,
  renderShippedEmail,
  renderDeliveredEmail,
  renderCancelledEmail,
  renderContactMessage,
  type Mail,
} from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Email previewer — development only.
 *
 * `/api/dev/emails` lists every template; `?t=<key>` renders one exactly as it
 * would arrive. It calls the same `render*` functions the send path uses, so a
 * template cannot look right here and wrong in someone's inbox.
 *
 * Returns 404 in production. It sends nothing and touches no customer data —
 * every value below is invented — but a public catalogue of the shop's mail is
 * still not something to serve to the world.
 */

const TO = 'preview@example.com'

const APP: Record<string, { label: string; mail: Mail }> = {
  welcome: {
    label: 'Welcome (account created)',
    mail: renderWelcomeEmail({ to: TO, name: 'Harpreet Singh' }),
  },
  newsletter: {
    label: 'Newsletter confirmation',
    mail: renderNewsletterWelcome({ to: TO }),
  },
  'order-partial': {
    label: 'Order confirmed (part-paid, balance on delivery)',
    mail: renderOrderConfirmation({
      to: TO,
      customerName: 'Harpreet Singh',
      orderNumber: 'DS-2026-1043',
      items: [
        { title: 'Air Force 1 Low White', brand: 'Nike', size: '9', qty: 1, price: 4299 },
        { title: 'Ultraboost Light', brand: 'Adidas', size: '8', qty: 2, price: 6499 },
      ],
      total: 17297,
      amountPaidOnline: 500,
      amountDueOnDelivery: 16797,
    }),
  },
  'order-paid': {
    label: 'Order confirmed (paid in full)',
    mail: renderOrderConfirmation({
      to: TO,
      customerName: 'Simran',
      orderNumber: 'DS-2026-1044',
      items: [{ title: 'Chelsea Boot Tan', brand: 'Diamond Stepss', size: '10', qty: 1, price: 3199 }],
      total: 3199,
      amountPaidOnline: 3199,
      amountDueOnDelivery: 0,
    }),
  },
  shipped: {
    label: 'Shipped',
    mail: renderShippedEmail({
      to: TO,
      customerName: 'Harpreet Singh',
      orderNumber: 'DS-2026-1043',
      courier: 'Delhivery',
      awb: '341982007745',
    }),
  },
  'shipped-bare': {
    label: 'Shipped (no courier assigned yet)',
    mail: renderShippedEmail({ to: TO, orderNumber: 'DS-2026-1045' }),
  },
  delivered: {
    label: 'Delivered',
    mail: renderDeliveredEmail({ to: TO, customerName: 'Harpreet Singh', orderNumber: 'DS-2026-1043' }),
  },
  cancelled: {
    label: 'Cancelled (with refund)',
    mail: renderCancelledEmail({
      to: TO,
      customerName: 'Harpreet Singh',
      orderNumber: 'DS-2026-1043',
      refundAmount: 500,
    }),
  },
  'cancelled-nopay': {
    label: 'Cancelled (nothing charged)',
    mail: renderCancelledEmail({ to: TO, customerName: 'Simran', orderNumber: 'DS-2026-1046' }),
  },
  contact: {
    label: 'Contact form (to the shop)',
    mail: renderContactMessage({
      name: 'Rajveer Kaur',
      email: 'rajveer@example.com',
      phone: '+91 98765 43210',
      subject: 'Size availability',
      message:
        'Hi, do you have the tan Chelsea boots in UK 11?\nI can come to the shop this Saturday if you do.',
    }),
  },
}

/** The Supabase auth templates, read off disk with their tokens filled in. */
const SUPABASE: Record<string, string> = {
  'supabase-magic-link': 'magic-link',
  'supabase-recovery': 'recovery',
  'supabase-confirm-signup': 'confirm-signup',
  'supabase-email-change': 'email-change',
  'supabase-invite': 'invite',
}

async function supabaseTemplate(file: string): Promise<string | null> {
  try {
    const html = await fs.readFile(path.join(process.cwd(), 'emails', 'supabase', `${file}.html`), 'utf8')
    // Supabase's Go template variables, filled with plausible values so the
    // preview shows real layout rather than raw {{ }} placeholders.
    return html
      .replace(/\{\{\s*\.Token\s*\}\}/g, '482913')
      .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, 'https://diamondstepss.com/auth/callback?code=preview')
      .replace(/\{\{\s*\.Email\s*\}\}/g, 'harpreet@example.com')
      .replace(/\{\{\s*\.NewEmail\s*\}\}/g, 'harpreet.new@example.com')
      .replace(/\{\{\s*\.SiteURL\s*\}\}/g, 'https://diamondstepss.com')
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }

  const key = req.nextUrl.searchParams.get('t')

  if (key && key in APP) {
    return new NextResponse(APP[key].mail.html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  if (key && key in SUPABASE) {
    const html = await supabaseTemplate(SUPABASE[key])
    if (!html) return new NextResponse('Template not built — run scripts/build-email-templates.mjs', { status: 404 })
    return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  // Index
  const link = (k: string, label: string, subject?: string) =>
    `<li><a href="/api/dev/emails?t=${k}">${label}</a>${
      subject ? `<span class="s">${subject.replace(/</g, '&lt;')}</span>` : ''
    }</li>`

  const html = `<!doctype html><meta charset="utf-8"><title>Email previews</title>
<style>
  body{font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:60px auto;padding:0 24px;color:#1a1a1a}
  h1{font-size:24px;letter-spacing:-.02em;margin:0 0 4px}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#e02020;margin:36px 0 10px}
  p.note{color:#767676;font-size:13px;margin:0 0 8px}
  ul{list-style:none;padding:0;margin:0}
  li{border-bottom:1px solid #eee;padding:11px 0}
  a{color:#1a1a1a;text-decoration:none;font-weight:600}
  a:hover{color:#e02020}
  .s{display:block;color:#767676;font-size:12.5px;font-weight:400}
</style>
<h1>Email previews</h1>
<p class="note">Development only. Rendered by the same code that sends them; nothing is sent.</p>
<h2>Transactional</h2>
<ul>${Object.entries(APP).map(([k, v]) => link(k, v.label, v.mail.subject)).join('')}</ul>
<h2>Supabase auth</h2>
<p class="note">Pasted into Supabase → Authentication → Email Templates. Tokens filled in here for preview.</p>
<ul>${Object.keys(SUPABASE).map((k) => link(k, k.replace('supabase-', ''))).join('')}</ul>`

  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
