import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pushOrder } from '@/lib/server/shiprocket'
import { sendOrderConfirmation } from '@/lib/email'

// Webhooks must never be cached or statically analysed.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Instamojo payment webhook — the source of truth for payment confirmation.
 *
 * The browser redirect after checkout can be forged or simply never happen
 * (user closes the tab), so an order is only ever marked PAID here.
 *
 * Signature scheme: remove `mac` from the posted fields, sort the remaining
 * keys, join their values with '|', HMAC-SHA1 with the account salt. Compare
 * against the posted `mac` field.
 *
 * Instamojo posts application/x-www-form-urlencoded, not JSON.
 */
export async function POST(req: NextRequest) {
  const salt = process.env.INSTAMOJO_SALT
  if (!salt) {
    console.error('[instamojo] INSTAMOJO_SALT is not set')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const params = new URLSearchParams(rawBody)
  const providedMac = params.get('mac')
  if (!providedMac) {
    return NextResponse.json({ error: 'missing mac' }, { status: 400 })
  }

  const fields = Array.from(params.entries()).filter(([k]) => k !== 'mac')
  fields.sort(([a], [b]) => a.localeCompare(b))
  const message = fields.map(([, v]) => v).join('|')
  const expected = createHmac('sha1', salt).update(message).digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(providedMac)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const paymentRequestId = params.get('payment_request_id')
  const paymentId = params.get('payment_id') ?? ''
  const status = params.get('status')
  const paidNow = Number(params.get('amount') ?? 0)

  if (!paymentRequestId) return NextResponse.json({ error: 'no payment_request_id' }, { status: 400 })

  // Service-role client: webhooks have no user session, so RLS must be bypassed.
  // This key is server-only and must never be exposed to the browser.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  if (status === 'Credit') {
    // Idempotent: replaying the same webhook must not double-apply anything.
    const { data: existing } = await admin
      .from('orders')
      .select('id, order_number, payment_status')
      .eq('gateway_payment_request_id', paymentRequestId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'unknown order' }, { status: 404 })
    if (existing.payment_status === 'PAID') return NextResponse.json({ received: true })

    const orderNumber = existing.order_number

    const { error } = await admin
      .from('orders')
      .update({ payment_status: 'PAID', status: 'CONFIRMED' })
      .eq('id', existing.id)

    if (error) {
      console.error('[instamojo] order update failed', error)
      return NextResponse.json({ error: 'update failed' }, { status: 500 })
    }

    // Record what was actually received. This is the only place money is
    // marked as paid — checkout always inserts 0.
    await admin.from('orders').update({ amount_paid_online: paidNow }).eq('id', existing.id)

    console.info('[instamojo] order paid', { orderNumber, paymentId, paidNow })

    // ── Fulfilment ──────────────────────────────────────────────────────────
    const { data: order } = await admin
      .from('orders')
      .select('*, order_items(*), profiles!orders_user_id_profiles_fkey(email, full_name)')
      .eq('id', existing.id)
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
          // Never fail the webhook on a fulfilment error — Instamojo would
          // retry and we'd double-handle a payment that already succeeded.
          console.error('[instamojo] shiprocket push failed', err)
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
          console.error('[instamojo] confirmation email failed', err)
        }
      }
    }
  } else if (status === 'Failed') {
    await admin
      .from('orders')
      .update({ payment_status: 'PENDING' })
      .eq('gateway_payment_request_id', paymentRequestId)
  }

  // Always 200 on a verified event — a non-2xx makes Instamojo retry.
  return NextResponse.json({ received: true })
}
