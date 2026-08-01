import { db } from './supabase/client'
import type { Order, OrderStatus } from './types'

/**
 * Admin queries.
 *
 * These use the ordinary browser client — no service-role key in the front end.
 * The admin RLS policies from migration 0003 are what widen the result set, so
 * a non-admin running exactly this code still sees only their own rows.
 */

export interface AdminOrder extends Order {
  customer_name: string | null
  customer_email: string | null
}

/** Every order, newest first, with line items and the customer's profile. */
export async function fetchAllOrders(limit = 200): Promise<AdminOrder[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*, order_items(*), profiles!orders_user_id_profiles_fkey(full_name, email)')
    .order('placed_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => {
    const { profiles, ...order } = row as Record<string, unknown> & {
      profiles?: { full_name: string | null; email: string | null } | null
    }
    return {
      ...(order as unknown as Order),
      customer_name: profiles?.full_name ?? null,
      customer_email: profiles?.email ?? null,
    }
  })
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await db().from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export interface AdminStats {
  revenueToday: number
  ordersToday: number
  avgOrderValue: number
  pendingShipments: number
  /** Share of orders by payment mode, as whole percentages. */
  paymentMix: { prepaid: number; cod: number; partialCod: number; total: number }
  /** Revenue for each of the last 7 days, oldest first. */
  last7Days: { label: string; value: number }[]
  totalRevenue: number
  totalOrders: number
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Derived in the browser from the order list — no extra round trips. */
export function computeStats(orders: AdminOrder[]): AdminStats {
  const live = orders.filter((o) => o.status !== 'CANCELLED')

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todays = live.filter((o) => new Date(o.placed_at) >= startOfDay)
  const revenueToday = todays.reduce((s, o) => s + Number(o.total ?? 0), 0)
  const totalRevenue = live.reduce((s, o) => s + Number(o.total ?? 0), 0)

  const mix = { prepaid: 0, cod: 0, partialCod: 0 }
  for (const o of live) {
    if (o.payment_mode === 'PREPAID') mix.prepaid++
    else if (o.payment_mode === 'COD') mix.cod++
    else mix.partialCod++
  }
  const mixTotal = mix.prepaid + mix.cod + mix.partialCod
  const pct = (n: number) => (mixTotal ? Math.round((n / mixTotal) * 100) : 0)

  // Seven buckets ending today, so the chart always spans a full week.
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const value = live
      .filter((o) => {
        const t = new Date(o.placed_at)
        return t >= d && t < next
      })
      .reduce((s, o) => s + Number(o.total ?? 0), 0)
    return { label: DAY_LABELS[d.getDay()], value }
  })

  return {
    revenueToday,
    ordersToday: todays.length,
    avgOrderValue: live.length ? Math.round(totalRevenue / live.length) : 0,
    pendingShipments: live.filter((o) => ['CONFIRMED', 'PACKED'].includes(o.status)).length,
    paymentMix: {
      prepaid: pct(mix.prepaid),
      cod: pct(mix.cod),
      partialCod: pct(mix.partialCod),
      total: mixTotal,
    },
    last7Days,
    totalRevenue,
    totalOrders: live.length,
  }
}
