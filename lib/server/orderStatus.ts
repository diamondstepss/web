import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendShippedEmail, sendDeliveredEmail, sendCancelledEmail } from '@/lib/email'
import { restoreStock } from '@/lib/server/stock'

export const ORDER_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

/**
 * Moves one order to `status` and tells the customer — the single-order and
 * bulk admin routes both call this so a status change behaves identically
 * (stock restore, notification email) no matter which one triggered it.
 *
 * A failed email never fails the status change: the shop has physically
 * packed the box, and refusing to record that because SMTP hiccuped would be
 * worse than a missing notification.
 */
export async function applyOrderStatus(
  admin: SupabaseClient,
  orderId: string,
  status: OrderStatusValue,
): Promise<{ updated: boolean; emailed: boolean }> {
  // Excluding an order that's already CANCELLED keeps a repeat call (a
  // double-click, or the same order caught in a bulk selection twice) from
  // restoring stock a second time below.
  const { data: updated, error: updateError } = await admin
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .neq('status', 'CANCELLED')
    .select('id')
    .maybeSingle()
  if (updateError) throw updateError
  if (!updated) return { updated: false, emailed: false }

  // Stock was reserved at checkout and never given back on cancellation —
  // only reachable pre-shipment (the admin UI only offers Cancel for
  // CONFIRMED/PACKED orders), so the goods are still on the shelf to return.
  if (status === 'CANCELLED') {
    const { data: items } = await admin
      .from('order_items')
      .select('product_id, size, qty')
      .eq('order_id', orderId)
    await restoreStock(admin, (items ?? []) as { product_id: string; size: string | null; qty: number }[])
  }

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

  return { updated: true, emailed }
}
