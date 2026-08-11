import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { applyOrderStatus, ORDER_STATUSES, type OrderStatusValue } from '@/lib/server/orderStatus'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Matches fetchAllOrders' own cap — never more orders than the admin list can
// show at once, so a bulk action can't outrun what's actually selectable.
const MAX_IDS = 200

/**
 * Same move as /api/admin/order-status, applied to many orders in one call —
 * the admin's Orders table selection toolbar uses this instead of firing one
 * request per row. Each order goes through the exact same applyOrderStatus()
 * as the single-order route (stock restore on cancel, notification email),
 * so a bulk action behaves identically to doing it one at a time.
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

  let body: { orderIds?: unknown; status?: unknown }
  try {
    body = (await req.json()) as { orderIds?: unknown; status?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const orderIds = Array.isArray(body.orderIds)
    ? body.orderIds.filter((id): id is string => typeof id === 'string')
    : []
  const status = String(body.status ?? '') as OrderStatusValue
  if (!orderIds.length || !ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'invalid orders or status' }, { status: 400 })
  }
  if (orderIds.length > MAX_IDS) {
    return NextResponse.json({ error: `Select ${MAX_IDS} orders or fewer at a time.` }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  let updated = 0
  const failed: string[] = []
  for (const orderId of orderIds) {
    try {
      const result = await applyOrderStatus(admin, orderId, status)
      if (result.updated) updated++
      else failed.push(orderId)
    } catch (e) {
      console.error('[orders/bulk-status] failed for', orderId, e)
      failed.push(orderId)
    }
  }

  return NextResponse.json({ ok: true, status, updated, failed })
}
