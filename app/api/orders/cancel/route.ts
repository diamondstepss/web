import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { restoreStock } from '@/lib/server/stock'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CANCELLABLE = ['CONFIRMED', 'PACKED']

/**
 * Customer-initiated cancellation — from "My account" for any order that
 * hasn't shipped yet, and from checkout's "waiting for payment" screen when
 * the customer gives up on a payment attempt (Instamojo's own page has no
 * way back to the shop, and stock stays reserved for it until this runs).
 *
 * The `.in('status', CANCELLABLE)` guard on the update makes this atomic
 * against a concurrent call — a second request (double-click, or the payment
 * webhook landing at the same moment) finds no matching row and skips
 * restoring stock a second time.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })

  let body: { orderId?: unknown; orderNumber?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : null
  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber : null
  if (!orderId && !orderNumber) {
    return NextResponse.json({ error: 'Missing order.' }, { status: 400 })
  }

  // RLS ("own orders") already scopes this to the caller, but user_id is
  // filtered explicitly too so the intent reads correctly regardless.
  let query = supabase.from('orders').update({ status: 'CANCELLED' }).eq('user_id', user.id).in('status', CANCELLABLE)
  query = orderId ? query.eq('id', orderId) : query.eq('order_number', orderNumber as string)
  const { data: cancelled, error } = await query.select('id').maybeSingle()

  if (error) {
    console.error('[orders/cancel] update failed', error)
    return NextResponse.json({ error: 'Could not cancel that order.' }, { status: 500 })
  }
  if (!cancelled) {
    return NextResponse.json(
      { error: 'That order can no longer be cancelled — it may already be packed, shipped, or cancelled.' },
      { status: 409 },
    )
  }

  // Service role: increment_stock is revoked from authenticated/anon so two
  // customers reserving the last pair at once can't both succeed.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: items } = await admin
    .from('order_items')
    .select('product_id, size, qty')
    .eq('order_id', cancelled.id)

  await restoreStock(admin, (items ?? []) as { product_id: string; size: string | null; qty: number }[])

  return NextResponse.json({ ok: true })
}
