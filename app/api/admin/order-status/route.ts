import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendShippedEmail, sendDeliveredEmail, sendCancelledEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
type Status = (typeof ALLOWED)[number]

/**
 * Moves an order to its next status, and tells the customer.
 *
 * This exists because the status change has to happen server-side to send the
 * email — RESEND_API_KEY is server-only, so the admin's browser cannot do it.
 * The update used to be a direct client-side write, which worked but meant the
 * customer was never told their parcel had shipped.
 *
 * A failed email never fails the status change: the shop has physically packed
 * the box, and refusing to record that because SMTP hiccuped would be worse
 * than a missing notification.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { orderId?: unknown; status?: unknown }
  try {
    body = (await req.json()) as { orderId?: unknown; status?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const status = String(body.status ?? '') as Status
  if (!orderId || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'invalid order or status' }, { status: 400 })
  }

  // Service role: the customer's email lives on their profile, which the
  // admin's session can read, but the join is simpler and safer done here.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { error: updateError } = await admin.from('orders').update({ status }).eq('id', orderId)
  if (updateError) {
    console.error('[order-status] update failed', updateError)
    return NextResponse.json({ error: 'could not update that order' }, { status: 502 })
  }

  // ── Notify ────────────────────────────────────────────────────────────────
  let emailed = false
  try {
    const { data: order } = await admin
      .from('orders')
      .select(
        'order_number, courier, awb, total, amount_paid_online, shipping_address, profiles!orders_user_id_profiles_fkey(email, full_name)',
      )
      .eq('id', orderId)
      .maybeSingle()

    const profileRow = order?.profiles as { email?: string; full_name?: string } | null
    const address = order?.shipping_address as { name?: string } | null
    const to = profileRow?.email
    const name = profileRow?.full_name ?? address?.name ?? null

    if (to && order) {
      const common = { to, customerName: name, orderNumber: order.order_number as string }
      if (status === 'SHIPPED') {
        await sendShippedEmail({ ...common, courier: order.courier, awb: order.awb })
        emailed = true
      } else if (status === 'DELIVERED') {
        await sendDeliveredEmail(common)
        emailed = true
      } else if (status === 'CANCELLED') {
        await sendCancelledEmail({ ...common, refundAmount: Number(order.amount_paid_online ?? 0) })
        emailed = true
      }
    }
  } catch (e) {
    // Logged, not surfaced — the status change already succeeded.
    console.error('[order-status] notification failed', e)
  }

  return NextResponse.json({ ok: true, status, emailed })
}
