import 'server-only'
import { Resend } from 'resend'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

/**
 * Transactional email via Resend.
 *
 * Note the split of responsibilities:
 *  - **Auth emails** (the sign-in OTP) are sent by Supabase, which is pointed at
 *    Resend's SMTP in the dashboard. Nothing here is involved in that path.
 *  - **Order emails** (below) are sent by us, through Resend's API.
 *
 * Both end up delivered by Resend, so there's one sending domain and one place
 * to look at deliverability.
 */

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? `${SITE.name} <orders@diamondstepss.com>`

export const isEmailConfigured = Boolean(apiKey)

const resend = apiKey ? new Resend(apiKey) : null

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

/** Shared shell so every email looks like the store. */
function shell(heading: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0e0e0">
        <tr><td style="background:#000000;padding:22px 28px">
          <span style="color:#ff3333;font-size:22px;font-weight:900;letter-spacing:-0.5px">DIAMOND</span>
          <span style="color:#ffffff;font-size:18px;font-style:italic;margin-left:4px">Stepss</span>
        </td></tr>
        <tr><td style="padding:32px 28px">
          <h1 style="margin:0 0 18px;font-size:22px;font-weight:800;color:#1a1a1a;text-transform:uppercase;letter-spacing:-0.5px">${heading}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e0e0e0;background:#fafafa">
          <p style="margin:0 0 6px;font-size:12px;color:#666">${ADDRESS_ONE_LINE}</p>
          <p style="margin:0;font-size:12px;color:#666">
            ${SITE.phone} · <a href="mailto:${SITE.email}" style="color:#e02020">${SITE.email}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export interface OrderEmailInput {
  to: string
  customerName: string
  orderNumber: string
  items: { title: string; brand: string; size?: string | null; qty: number; price: number }[]
  total: number
  amountPaidOnline: number
  amountDueOnDelivery: number
}

/** Sent once the payment webhook confirms an order. */
export async function sendOrderConfirmation(input: OrderEmailInput) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping order confirmation')
    return { skipped: true as const }
  }

  const rows = input.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">${i.brand}</span><br>
          <span style="font-size:14px;color:#1a1a1a;font-weight:600">${i.title}</span><br>
          <span style="font-size:12px;color:#666">${i.size ? `Size ${i.size}` : ''}${i.qty > 1 ? ` · Qty ${i.qty}` : ''}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;font-weight:700;color:#1a1a1a">${inr(i.price)}</td>
      </tr>`,
    )
    .join('')

  // The balance line is the whole point of partial COD — make it unmissable.
  const balance =
    input.amountDueOnDelivery > 0
      ? `<div style="margin-top:18px;padding:14px 16px;background:#fff8e6;border-left:3px solid #f59e0b">
           <p style="margin:0;font-size:14px;color:#1a1a1a">
             <strong>${inr(input.amountDueOnDelivery)} to pay on delivery</strong><br>
             <span style="font-size:12px;color:#666">Please keep cash ready. ${inr(input.amountPaidOnline)} already paid online.</span>
           </p>
         </div>`
      : ''

  const body = `
    <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
      Thanks ${input.customerName || 'for your order'} — we've got it and we're packing it now.
      Your order number is <strong style="color:#1a1a1a">${input.orderNumber}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
      <tr><td style="padding:14px 0;font-size:15px;font-weight:800;color:#1a1a1a">Total</td>
          <td align="right" style="padding:14px 0;font-size:15px;font-weight:800;color:#1a1a1a">${inr(input.total)}</td></tr>
    </table>
    ${balance}
    <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'}/order-tracking"
       style="display:inline-block;margin-top:24px;background:#ff3333;color:#fff;text-decoration:none;padding:13px 26px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px">
      Track your order
    </a>`

  return resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `Order ${input.orderNumber} confirmed — ${SITE.name}`,
    html: shell('Order confirmed', body),
  })
}

/** Sent when Shiprocket reports the parcel has shipped. */
export async function sendShippedEmail(opts: {
  to: string
  orderNumber: string
  courier: string
  awb: string
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping shipped email')
    return { skipped: true as const }
  }

  const body = `
    <p style="margin:0 0 18px;font-size:14px;color:#444;line-height:1.6">
      Order <strong style="color:#1a1a1a">${opts.orderNumber}</strong> is on its way.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0">
      <tr><td style="padding:12px 16px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Courier</td>
          <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#1a1a1a">${opts.courier}</td></tr>
      <tr><td style="padding:12px 16px;border-top:1px solid #eee;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">AWB</td>
          <td align="right" style="padding:12px 16px;border-top:1px solid #eee;font-size:14px;font-weight:700;color:#1a1a1a">${opts.awb}</td></tr>
    </table>`

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your order ${opts.orderNumber} has shipped`,
    html: shell('On its way', body),
  })
}

// ── Contact form ────────────────────────────────────────────────────────────

export interface ContactMessage {
  name: string
  email: string
  phone: string
  subject?: string
  message: string
}

/**
 * Forwards a contact-form enquiry to the shop.
 *
 * `replyTo` is the customer, so hitting reply in the shop's inbox answers them
 * directly. The form previously only flipped a "submitted" flag in React and
 * sent nothing, so every enquiry was silently lost.
 */
export async function sendContactMessage(msg: ContactMessage) {
  if (!resend) {
    throw new Error('Email is not configured — RESEND_API_KEY is missing.')
  }

  // The values land inside an HTML email, so escape them.
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;font-size:13px;color:#666;width:110px;vertical-align:top">${label}</td>
      <td style="padding:6px 0;font-size:14px;color:#1a1a1a">${esc(value)}</td>
    </tr>`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row('Name', msg.name)}
      ${row('Email', msg.email)}
      ${row('Phone', msg.phone)}
      ${msg.subject ? row('Subject', msg.subject) : ''}
    </table>
    <div style="margin-top:18px;padding:16px;background:#fafafa;border:1px solid #e0e0e0">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap">${esc(msg.message)}</p>
    </div>`

  return resend.emails.send({
    from: FROM,
    to: SITE.email,
    replyTo: msg.email,
    subject: `Website enquiry — ${msg.subject || msg.name}`,
    html: shell('New enquiry', body),
  })
}
