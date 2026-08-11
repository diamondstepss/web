import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { applyOrderStatus, ORDER_STATUSES, type OrderStatusValue } from '@/lib/server/orderStatus'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const status = String(body.status ?? '') as OrderStatusValue
  if (!orderId || !ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'invalid order or status' }, { status: 400 })
  }

  // Service role: the customer's email lives on their profile, which the
  // admin's session can read, but the join is simpler and safer done here.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  try {
    const { emailed } = await applyOrderStatus(admin, orderId, status)
    return NextResponse.json({ ok: true, status, emailed })
  } catch (e) {
    console.error('[order-status] update failed', e)
    return NextResponse.json({ error: 'could not update that order' }, { status: 502 })
  }
}
