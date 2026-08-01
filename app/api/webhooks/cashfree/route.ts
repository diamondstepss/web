import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pushOrder } from '@/lib/server/shiprocket'
import { sendOrderConfirmation } from '@/lib/email'

// Webhooks must never be cached or statically analysed.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cashfree payment webhook — the source of truth for payment confirmation.
 *
 * The browser redirect after checkout can be forged or simply never happen
 * (user closes the tab), so an order is only ever marked PAID here.
 *
 * Signature scheme: base64(HMAC-SHA256(timestamp + rawBody, clientSecret))
 * compared against the `x-webhook-signature` header.
 *
 * The raw body is mandatory — re-serialising parsed JSON reorders keys and the
 * signature will never match. That is why this reads req.text(), not req.json().
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CASHFREE_SECRET_KEY
  if (!secret) {
    console.error('[cashfree] CASHFREE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature')
  const timestamp = req.headers.get('x-webhook-timestamp')

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'missing signature headers' }, { status: 400 })
  }

  // Reject replays of an old, previously-valid payload.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return NextResponse.json({ error: 'stale timestamp' }, { status: 400 })
  }

  const expected = createHmac('sha256', secret).update(timestamp + rawBody).digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let event: {
    type?: string
    data?: {
      order?: { order_id?: string; order_amount?: number }
      payment?: { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const orderNumber = event.data?.order?.order_id
  const paymentId = String(event.data?.payment?.cf_payment_id ?? '')
  const status = event.data?.payment?.payment_status

  if (!orderNumber) return NextResponse.json({ error: 'no order id' }, { status: 400 })

  // Service-role client: webhooks have no user session, so RLS must be bypassed.
  // This key is server-only and must never be exposed to the browser.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  if (status === 'SUCCESS') {
    // Idempotent: replaying the same webhook must not double-apply anything.
    const { data: existing } = await admin
      .from('orders')
      .select('id, payment_status')
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'unknown order' }, { status: 404 })
    if (existing.payment_status === 'PAID') return NextResponse.json({ received: true })

    const { error } = await admin
      .from('orders')
      .update({ payment_status: 'PAID', status: 'CONFIRMED' })
      .eq('order_number', orderNumber)

    if (error) {
      console.error('[cashfree] order update failed', error)
      return NextResponse.json({ error: 'update failed' }, { status: 500 })
    }

    // Record what was actually received. This is the only place money is
    // marked as paid — checkout always inserts 0.
    const paidNow = Number(event.data?.payment?.payment_amount ?? 0)
    await admin
      .from('orders')
      .update({ amount_paid_online: paidNow })
      .eq('order_number', orderNumber)

    console.info('[cashfree] order paid', { orderNumber, paymentId, paidNow })

    // ── Fulfilment ──────────────────────────────────────────────────────────
    const { data: order } = await admin
      .from('orders')
      .select('*, order_items(*), profiles!orders_user_id_profiles_fkey(email, full_name)')
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (order) {
      const address = order.shipping_address as {
        name: string; phone: string; line1: string; line2?: string | null
        city: string; state: string; pincode: string
      } | null

      if (address) {
        try {
          const shipment = await pushOrder({
            orderNumber,
            placedAt: order.placed_at as string,
            paymentMode: order.payment_mode,
            // Partial COD: the courier collects only the balance.
            collectAmount: Number(order.amount_due_on_delivery ?? 0),
            subTotal: Number(order.total ?? 0),
            address,
            items: (order.order_items ?? []).map((i: { title: string; product_id: string; qty: number; price: number }) => ({
              title: i.title,
              sku: i.product_id,
              qty: i.qty,
              price: Number(i.price),
            })),
          })
          if (shipment?.shiprocketOrderId) {
            await admin
              .from('orders')
              .update({ courier: 'Shiprocket' })
              .eq('order_number', orderNumber)
          }
        } catch (err) {
          // Never fail the webhook on a fulfilment error — Cashfree would retry
          // and we'd double-handle a payment that already succeeded.
          console.error('[cashfree] shiprocket push failed', err)
        }
      }

      const profile = order.profiles as { email?: string; full_name?: string } | null
      if (profile?.email) {
        try {
          await sendOrderConfirmation({
            to: profile.email,
            customerName: profile.full_name ?? '',
            orderNumber,
            items: (order.order_items ?? []).map((i: { title: string; brand: string; size: string | null; qty: number; price: number }) => ({
              title: i.title, brand: i.brand, size: i.size, qty: i.qty, price: Number(i.price),
            })),
            total: Number(order.total ?? 0),
            amountPaidOnline: paidNow,
            amountDueOnDelivery: Number(order.amount_due_on_delivery ?? 0),
          })
        } catch (err) {
          console.error('[cashfree] confirmation email failed', err)
        }
      }
    }
  } else if (status === 'FAILED' || status === 'USER_DROPPED') {
    await admin.from('orders').update({ payment_status: 'PENDING' }).eq('order_number', orderNumber)
  }

  // Always 200 on a verified event — a non-2xx makes Cashfree retry.
  return NextResponse.json({ received: true })
}
