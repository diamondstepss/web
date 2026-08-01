import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Shiprocket tracking webhook. Configure the endpoint and token under
 * Settings → API → Webhooks in the Shiprocket dashboard.
 *
 * Shiprocket authenticates with a shared token in `x-api-key` rather than an
 * HMAC signature, so the token is the only thing standing between this route
 * and a spoofed status update — keep it long and secret.
 */

/** Shiprocket status strings → our `orders.status` values. */
const STATUS_MAP: Record<string, string> = {
  'ORDER CONFIRMED': 'CONFIRMED',
  'PICKUP SCHEDULED': 'PACKED',
  'PICKED UP': 'SHIPPED',
  'IN TRANSIT': 'SHIPPED',
  'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELLED',
  CANCELLED: 'CANCELLED',
  RTO_INITIATED: 'CANCELLED',
  RTO_DELIVERED: 'CANCELLED',
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN
  if (!expectedToken) {
    console.error('[shiprocket] SHIPROCKET_WEBHOOK_TOKEN is not set')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  if (req.headers.get('x-api-key') !== expectedToken) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  let payload: {
    order_id?: string
    awb?: string
    current_status?: string
    courier_name?: string
    etd?: string
  }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const orderNumber = payload.order_id
  if (!orderNumber) return NextResponse.json({ error: 'no order id' }, { status: 400 })

  const mapped = STATUS_MAP[(payload.current_status ?? '').toUpperCase()]

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const patch: Record<string, string> = {}
  if (mapped) patch.status = mapped
  if (payload.awb) patch.awb = payload.awb
  if (payload.courier_name) patch.courier = payload.courier_name

  if (Object.keys(patch).length === 0) {
    // Unknown status — acknowledge so Shiprocket stops retrying, but log it so
    // an unmapped status shows up rather than silently doing nothing.
    console.warn('[shiprocket] unmapped status', payload.current_status)
    return NextResponse.json({ received: true })
  }

  const { error } = await admin.from('orders').update(patch).eq('order_number', orderNumber)
  if (error) {
    console.error('[shiprocket] update failed', error)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }

  // TODO(PLAN.md §9): fire the customer SMS/WhatsApp on SHIPPED and
  // OUT_FOR_DELIVERY, and open an NDR task on a failed delivery attempt.
  return NextResponse.json({ received: true })
}
