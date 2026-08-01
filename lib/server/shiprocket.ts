import 'server-only'
import { SITE } from '@/data/site'

/**
 * Shiprocket — order push.
 *
 * Called from the payment webhook once money is confirmed, never at checkout:
 * pushing an unpaid order would have the courier collecting for something we
 * haven't been paid for.
 */

const BASE = 'https://apiv2.shiprocket.in/v1/external'

export const isShiprocketConfigured = Boolean(
  process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD,
)

/**
 * Tokens last ~10 days. Cached in module scope so a burst of webhooks doesn't
 * re-authenticate every time; a cold lambda simply logs in again.
 */
let cached: { token: string; expires: number } | null = null

async function token(): Promise<string | null> {
  if (!isShiprocketConfigured) return null
  if (cached && cached.expires > Date.now()) return cached.token

  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!res.ok) {
    console.error('[shiprocket] auth failed', res.status, await res.text())
    return null
  }

  const body = (await res.json()) as { token?: string }
  if (!body.token) return null

  // Refresh a day early rather than discover expiry mid-webhook.
  cached = { token: body.token, expires: Date.now() + 9 * 24 * 60 * 60 * 1000 }
  return body.token
}

export interface ShipmentInput {
  orderNumber: string
  placedAt: string
  paymentMode: 'PREPAID' | 'COD' | 'PARTIAL_COD'
  /** What the courier collects on delivery — 0 for fully prepaid. */
  collectAmount: number
  subTotal: number
  address: {
    name: string
    phone: string
    line1: string
    line2?: string | null
    city: string
    state: string
    pincode: string
  }
  items: { title: string; sku: string; qty: number; price: number }[]
}

export async function pushOrder(input: ShipmentInput): Promise<{ shiprocketOrderId?: number } | null> {
  const auth = await token()
  if (!auth) {
    console.warn('[shiprocket] not configured — skipping order push')
    return null
  }

  const [first, ...rest] = input.address.name.split(' ')

  const res = await fetch(`${BASE}/orders/create/adhoc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
    body: JSON.stringify({
      order_id: input.orderNumber,
      order_date: new Date(input.placedAt).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: process.env.SHIPROCKET_PICKUP ?? 'Primary',
      billing_customer_name: first || 'Customer',
      billing_last_name: rest.join(' '),
      billing_address: input.address.line1,
      billing_address_2: input.address.line2 ?? '',
      billing_city: input.address.city,
      billing_pincode: input.address.pincode,
      billing_state: input.address.state,
      billing_country: 'India',
      billing_email: SITE.email,
      billing_phone: input.address.phone.replace(/[^\d]/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: input.items.map((i) => ({
        name: i.title,
        sku: i.sku,
        units: i.qty,
        selling_price: i.price,
      })),
      // Partial COD is sent as COD with only the balance collectable. Confirm
      // courier-level support with your Shiprocket account manager (PLAN.md §9).
      payment_method: input.collectAmount > 0 ? 'COD' : 'Prepaid',
      sub_total: input.collectAmount > 0 ? input.collectAmount : input.subTotal,
      length: 30,
      breadth: 20,
      height: 12,
      weight: 0.75,
    }),
  })

  const body = (await res.json()) as { order_id?: number; message?: string }
  if (!res.ok) {
    console.error('[shiprocket] push failed', res.status, body)
    return null
  }

  console.info('[shiprocket] order pushed', input.orderNumber, body.order_id)
  return { shiprocketOrderId: body.order_id }
}
