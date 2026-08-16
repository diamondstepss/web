import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Guest order tracking.
 *
 * The tracking page previously ran a 700ms setTimeout and then displayed a
 * fabricated order number and AWB — inventing shipment details for an order
 * that may not exist. This looks the order up for real.
 *
 * Uses the service role because a guest has no session, but the order number
 * ALONE is not enough to see an order: the request must also match the phone
 * on the shipping address. Order numbers are guessable; phone numbers paired
 * with them are not.
 */

const recent = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 12

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  recent.set(ip, hits)
  return hits.length > MAX_PER_WINDOW
}

/** Last 10 digits, so +91 / 0 / spacing differences all compare equal. */
const normalisePhone = (v: string) => v.replace(/\D/g, '').slice(-10)

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Tracking is temporarily unavailable.' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many lookups. Try again shortly.' }, { status: 429 })
  }

  let body: { orderNumber?: unknown; phone?: unknown }
  try {
    body = (await req.json()) as { orderNumber?: unknown; phone?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase().slice(0, 40) : ''
  const phone = typeof body.phone === 'string' ? normalisePhone(body.phone) : ''

  if (!orderNumber || phone.length !== 10) {
    return NextResponse.json(
      { error: 'Enter your order number and the 10-digit phone number used on the order.' },
      { status: 400 },
    )
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await admin
    .from('orders')
    .select('order_number, status, payment_status, payment_mode, fulfillment_type, placed_at, awb, courier, total, amount_due_on_delivery, shipping_address')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (error) {
    console.error('[track] lookup failed', error)
    return NextResponse.json({ error: 'Could not look that up just now.' }, { status: 502 })
  }

  // Same response whether the order is missing or the phone doesn't match, so
  // this can't be used to test which order numbers exist.
  const addr = data?.shipping_address as { phone?: string; name?: string; city?: string } | null
  if (!data || normalisePhone(addr?.phone ?? '') !== phone) {
    return NextResponse.json(
      { error: 'No order found with that number and phone. Check both and try again.' },
      { status: 404 },
    )
  }

  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: data.order_number,
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMode: data.payment_mode,
      fulfillmentType: data.fulfillment_type,
      placedAt: data.placed_at,
      // Null until Shiprocket assigns one — the UI must not invent a number.
      awb: data.awb ?? null,
      courier: data.courier ?? null,
      total: Number(data.total ?? 0),
      dueOnDelivery: Number(data.amount_due_on_delivery ?? 0),
      city: addr?.city ?? null,
    },
  })
}
