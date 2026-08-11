import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Gives back stock reserved by decrement_stock at order creation. Shared by
 * every path that can end an order before it ships: checkout's own rollback
 * when payment setup fails, and cancellation from the admin or the customer.
 */
export async function restoreStock(
  admin: SupabaseClient,
  lines: { product_id: string; size: string | null; qty: number }[],
) {
  for (const l of lines) {
    if (l.size) {
      await admin.rpc('increment_stock', { p_slug: l.product_id, p_size: l.size, p_qty: l.qty })
    } else {
      await admin.rpc('increment_stock', { p_slug: l.product_id, p_qty: l.qty })
    }
  }
}
