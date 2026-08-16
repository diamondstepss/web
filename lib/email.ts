import 'server-only'
import { Resend } from 'resend'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'
import { getStoreSettings, DEFAULT_SETTINGS, type StoreSettings } from './settings'
import {
  shell,
  heading,
  paragraph,
  button,
  panel,
  divider,
  row,
  inr,
  esc,
  C,
  SITE_URL,
  BODY,
} from './email-template'

/**
 * Transactional email, all through Resend.
 *
 * Two paths, one provider:
 *  - **App emails** (everything in this file) go through the Resend API.
 *  - **Auth emails** — sign-in code, password reset, address confirmation —
 *    are sent by Supabase, which is pointed at Resend's SMTP in the dashboard.
 *    Matching templates live in emails/supabase/; paste them into
 *    Supabase → Authentication → Email Templates.
 *
 * Everything therefore leaves from one domain, with one place to look at
 * deliverability. The shared look lives in lib/email-template.ts.
 */

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? `${SITE.name} <orders@diamondstepss.com>`

export const isEmailConfigured = Boolean(apiKey)

const resend = apiKey ? new Resend(apiKey) : null

/**
 * A rendered email, before it goes anywhere.
 *
 * Every template is built by a `render*` function returning one of these, and
 * sent by a one-line `send*` wrapper. The split exists so the previewer at
 * /api/dev/emails can show exactly what customers receive — if the preview and
 * the send could drift apart, the preview would be worthless.
 */
export interface Mail {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/** Every send goes through here, so a missing key fails the same way once. */
async function send(opts: Mail) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${opts.subject}"`)
    return { skipped: true as const }
  }
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  })
}

/** Line items, shared by the order emails. */
function itemRows(
  items: { title: string; brand: string; size?: string | null; qty: number; price: number }[],
) {
  return items
    .map(
      (i) => `<tr>
      <td style="padding:12px 0;border-bottom:1px solid ${C.line}">
        <span style="font-family:${BODY};font-size:10px;color:${C.muted};text-transform:uppercase;letter-spacing:0.12em">${esc(i.brand)}</span><br>
        <span style="font-family:${BODY};font-size:14px;color:${C.ink};font-weight:600">${esc(i.title)}</span><br>
        <span style="font-family:${BODY};font-size:12px;color:${C.muted}">${i.size ? `Size UK ${esc(String(i.size))}` : 'One size'}${i.qty > 1 ? ` · Qty ${i.qty}` : ''}</span>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font-family:${BODY};font-size:14px;font-weight:700;color:${C.ink}">${inr(i.price * i.qty)}</td>
    </tr>`,
    )
    .join('')
}

// ── Account ─────────────────────────────────────────────────────────────────

/**
 * Sent once, after a customer creates an account.
 *
 * Takes settings rather than reading SITE.freeShippingOver: the threshold is
 * configurable in the admin, and an email promising free shipping at a figure
 * the cart no longer honours is worse than not mentioning it at all.
 */
export function renderWelcomeEmail(opts: {
  to: string
  name?: string | null
  settings?: StoreSettings
}): Mail {
  const s = opts.settings ?? DEFAULT_SETTINGS
  const first = (opts.name ?? '').trim().split(' ')[0]
  const body = `
    ${heading(first ? `Welcome, ${first}` : 'Welcome to Diamond Stepss')}
    ${paragraph(
      'Your account is ready. You can track orders, save addresses and keep a wishlist — all in one place.',
    )}
    ${panel(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-family:${BODY};font-size:13px;line-height:1.9;color:${C.body}">
          <strong style="color:${C.ink}">Free shipping</strong> on orders over ${inr(s.freeShippingOver)}<br>
          <strong style="color:${C.ink}">Cash on delivery</strong> across India<br>
          <strong style="color:${C.ink}">${SITE.returnWindowDays}-day returns</strong> on unworn pairs
        </td></tr>
      </table>`)}
    ${button('Start shopping', `${SITE_URL}/shop`)}
    ${paragraph(
      `Genuine stock only, straight from our shop in ${esc(SITE.address.city)}. Questions? Just reply to this email.`,
    )}`

  return {
    to: opts.to,
    subject: `Welcome to ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Account created',
      preheader: 'Your account is ready — track orders, save addresses and build a wishlist.',
    }),
    replyTo: SITE.email,
  }
}

export async function sendWelcomeEmail(opts: { to: string; name?: string | null }) {
  return send(renderWelcomeEmail({ ...opts, settings: await getStoreSettings() }))
}

/** Confirms a newsletter signup. */
export function renderNewsletterWelcome(opts: { to: string }): Mail {
  const body = `
    ${heading('You are on the list')}
    ${paragraph(
      'You will hear from us when new pairs land and when prices drop — not more often than that.',
    )}
    ${button('Browse new arrivals', `${SITE_URL}/product-category/new-arrivals`)}
    ${paragraph(
      `<span style="font-size:13px;color:${C.muted}">Changed your mind? Reply with &quot;unsubscribe&quot; and we will take you off straight away.</span>`,
    )}`

  return {
    to: opts.to,
    subject: `You're on the list — ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Subscribed',
      preheader: 'New drops and price cuts, straight to your inbox.',
    }),
    replyTo: SITE.email,
  }
}

export const sendNewsletterWelcome = (opts: { to: string }) => send(renderNewsletterWelcome(opts))

// ── Orders ──────────────────────────────────────────────────────────────────

export interface OrderEmailInput {
  to: string
  customerName: string
  orderNumber: string
  items: { title: string; brand: string; size?: string | null; qty: number; price: number }[]
  total: number
  amountPaidOnline: number
  amountDueOnDelivery: number
  fulfillmentType?: 'DELIVERY' | 'PICKUP'
}

/** Sent once the payment webhook confirms an order. */
export function renderOrderConfirmation(input: OrderEmailInput): Mail {
  const first = (input.customerName ?? '').trim().split(' ')[0]

  // The balance line is the whole point of partial COD — make it unmissable.
  const balance =
    input.amountDueOnDelivery > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;background:#fff8e6;border-left:3px solid #f59e0b;border-radius:6px">
           <tr><td style="padding:14px 16px;font-family:${BODY}">
             <strong style="font-size:15px;color:${C.ink}">${inr(input.amountDueOnDelivery)} to pay on delivery</strong><br>
             <span style="font-size:12.5px;color:${C.muted}">Please keep cash ready. ${inr(input.amountPaidOnline)} is already paid.</span>
           </td></tr>
         </table>`
      : ''

  const isPickup = input.fulfillmentType === 'PICKUP'
  const pickupNote = isPickup
    ? paragraph(`We'll email you again the moment it's ready to collect from ${ADDRESS_ONE_LINE}.`)
    : ''

  const body = `
    ${heading(first ? `Thanks, ${first}` : 'Thanks for your order')}
    ${paragraph(
      `We have your order and we're packing it now. Your order number is <strong style="color:${C.ink}">${esc(input.orderNumber)}</strong>.`,
    )}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(input.items)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
      ${row('Total', inr(input.total), { strong: true })}
      ${input.amountPaidOnline > 0 ? row('Paid online', `− ${inr(input.amountPaidOnline)}`, { tint: C.success }) : ''}
    </table>
    ${balance}
    ${pickupNote}
    ${button(isPickup ? 'View order' : 'Track your order', `${SITE_URL}/order-tracking`)}`

  return {
    to: input.to,
    subject: `Order ${input.orderNumber} confirmed — ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Order confirmed',
      preheader: `${input.orderNumber} · ${inr(input.total)}${
        input.amountDueOnDelivery > 0 ? ` · ${inr(input.amountDueOnDelivery)} due on delivery` : ' · paid in full'
      }`,
    }),
    replyTo: SITE.email,
  }
}

export const sendOrderConfirmation = (input: OrderEmailInput) => send(renderOrderConfirmation(input))

/** Sent when the parcel is dispatched. */
export interface ShippedInput {
  to: string
  customerName?: string | null
  orderNumber: string
  courier?: string | null
  awb?: string | null
  trackingUrl?: string | null
}

export function renderShippedEmail(opts: ShippedInput): Mail {
  const first = (opts.customerName ?? '').trim().split(' ')[0]
  const body = `
    ${heading('Your order is on its way')}
    ${paragraph(
      `${first ? `${esc(first)}, your` : 'Your'} order <strong style="color:${C.ink}">${esc(opts.orderNumber)}</strong> has left our shop.`,
    )}
    ${panel(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Courier', esc(opts.courier ?? 'Assigned at pickup'))}
        ${row('Tracking number', opts.awb ? `<span style="font-family:monospace">${esc(opts.awb)}</span>` : 'Available shortly')}
        ${row('Expected', esc(SITE.deliveryDays))}
      </table>`)}
    ${button('Track your parcel', opts.trackingUrl ?? `${SITE_URL}/order-tracking`)}
    ${paragraph(
      `<span style="font-size:13px;color:${C.muted}">Tracking can take a few hours to show its first scan after pickup.</span>`,
    )}`

  return {
    to: opts.to,
    subject: `Order ${opts.orderNumber} has shipped — ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Dispatched',
      preheader: `${opts.courier ? `${opts.courier} · ` : ''}Arriving in ${SITE.deliveryDays}.`,
    }),
    replyTo: SITE.email,
  }
}

export const sendShippedEmail = (opts: ShippedInput) => send(renderShippedEmail(opts))

/** Sent when an order is marked delivered. */
export interface StatusInput {
  to: string
  customerName?: string | null
  orderNumber: string
}

export function renderDeliveredEmail(opts: StatusInput): Mail {
  const first = (opts.customerName ?? '').trim().split(' ')[0]
  const body = `
    ${heading('Delivered — enjoy them')}
    ${paragraph(
      `${first ? `${esc(first)}, your` : 'Your'} order <strong style="color:${C.ink}">${esc(opts.orderNumber)}</strong> has been delivered.`,
    )}
    ${paragraph(
      `If the fit isn't right, you have <strong style="color:${C.ink}">${SITE.returnWindowDays} days</strong> to return unworn pairs with their tags and box.`,
    )}
    ${button('Shop again', `${SITE_URL}/shop`)}
    ${divider()}
    ${paragraph(
      `<span style="font-size:13px;color:${C.muted}">Happy with them? A review on Google genuinely helps a small shop like ours — <a href="${SITE.social.maps}" style="color:${C.accent}">leave one here</a>.</span>`,
    )}`

  return {
    to: opts.to,
    subject: `Order ${opts.orderNumber} delivered — ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Delivered',
      preheader: `Your order arrived. ${SITE.returnWindowDays} days to return if the fit isn't right.`,
    }),
    replyTo: SITE.email,
  }
}

export const sendDeliveredEmail = (opts: StatusInput) => send(renderDeliveredEmail(opts))

/** Sent when an order is cancelled. */
export function renderCancelledEmail(opts: StatusInput & { refundAmount?: number }): Mail {
  const first = (opts.customerName ?? '').trim().split(' ')[0]
  const body = `
    ${heading('Order cancelled')}
    ${paragraph(
      `${first ? `${esc(first)}, your` : 'Your'} order <strong style="color:${C.ink}">${esc(opts.orderNumber)}</strong> has been cancelled.`,
    )}
    ${
      opts.refundAmount && opts.refundAmount > 0
        ? paragraph(
            `A refund of <strong style="color:${C.ink}">${inr(opts.refundAmount)}</strong> is on its way back to the method you paid with. Banks usually take 5–7 working days to show it.`,
          )
        : paragraph('Nothing was charged, so there is no refund to process.')
    }
    ${button('Browse the shop', `${SITE_URL}/shop`)}
    ${paragraph(
      `<span style="font-size:13px;color:${C.muted}">If you didn't ask for this, reply to this email and we'll look into it.</span>`,
    )}`

  return {
    to: opts.to,
    subject: `Order ${opts.orderNumber} cancelled — ${SITE.name}`,
    html: shell(body, {
      eyebrow: 'Cancelled',
      preheader: opts.refundAmount ? `Refund of ${inr(opts.refundAmount)} on its way.` : 'Nothing was charged.',
    }),
    replyTo: SITE.email,
  }
}

export const sendCancelledEmail = (opts: StatusInput & { refundAmount?: number }) =>
  send(renderCancelledEmail(opts))

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
export function renderContactMessage(msg: ContactMessage): Mail {
  const body = `
    ${heading('New enquiry')}
    ${panel(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Name', esc(msg.name))}
        ${row('Email', esc(msg.email))}
        ${msg.phone ? row('Phone', esc(msg.phone)) : ''}
        ${msg.subject ? row('Subject', esc(msg.subject)) : ''}
      </table>`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-left:3px solid ${C.accent}">
      <tr><td style="padding:4px 0 4px 16px;font-family:${BODY};font-size:15px;line-height:1.65;color:${C.ink};white-space:pre-wrap">${esc(msg.message)}</td></tr>
    </table>
    <div style="height:18px;line-height:18px;font-size:0">&nbsp;</div>
    ${paragraph(`<span style="font-size:13px;color:${C.muted}">Reply to this email to answer ${esc(msg.name)} directly.</span>`)}`

  return {
    to: SITE.email,
    subject: `Website enquiry — ${msg.subject || msg.name}`,
    html: shell(body, {
      eyebrow: 'Contact form',
      preheader: `${msg.name} · ${msg.message.slice(0, 90)}`,
    }),
    replyTo: msg.email,
  }
}

export async function sendContactMessage(msg: ContactMessage) {
  // Unlike the others, this one throws: the contact form tells the visitor
  // their message was sent, and that must not be a lie.
  if (!resend) throw new Error('Email is not configured — RESEND_API_KEY is missing.')
  return send(renderContactMessage(msg))
}
