'use client'

import Link from 'next/link'
import { ArrowUpRight, IndianRupee, ShoppingBag, Receipt, Truck, Inbox , MoveHorizontal } from 'lucide-react'
import { computeStats } from '@/lib/admin'
import {
  inr,
  inrShort,
  Panel,
  Eyebrow,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
  useAdminOrders,
} from '@/components/admin/shared'

const STATUS_TONE: Record<string, string> = {
  DELIVERED: 'adm-badge-ok',
  SHIPPED: 'adm-badge-acc',
  PACKED: 'adm-badge-acc',
  CONFIRMED: 'adm-badge-warn',
  CANCELLED: 'adm-badge-bad',
}

export default function DashboardView() {
  const { orders, loading, error } = useAdminOrders()
  const stats = computeStats(orders)
  const peak = Math.max(...stats.last7Days.map((d) => d.value), 1)

  const KPIS = [
    { label: 'Revenue today', value: inr(stats.revenueToday), icon: IndianRupee },
    { label: 'Orders today', value: String(stats.ordersToday), icon: ShoppingBag },
    { label: 'Avg order value', value: inr(stats.avgOrderValue), icon: Receipt },
    { label: 'Pending shipments', value: String(stats.pendingShipments), icon: Truck },
  ]

  const MIX = [
    { label: 'Prepaid', pct: stats.paymentMix.prepaid, tint: 'var(--adm-ok)' },
    { label: 'COD', pct: stats.paymentMix.cod, tint: 'var(--adm-warn)' },
    { label: 'Partial COD', pct: stats.paymentMix.partialCod, tint: 'var(--adm-accent)' },
  ]

  return (
    <div>
      <PageHeading
        title="Dashboard"
        description="Everything happening in the store right now, straight from the database."
        meta={loading ? 'Loading…' : 'Live'}
        live={!loading && !error}
      />

      <ErrorNote>{error}</ErrorNote>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className={`adm-stat p-4 adm-rise adm-rise-${i + 1}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <Eyebrow>{k.label}</Eyebrow>
              <k.icon size={14} style={{ color: 'var(--adm-text-3)' }} />
            </div>
            <p className="adm-display adm-num text-[30px] leading-none" style={{ color: 'var(--adm-text)' }}>
              {loading ? <span className="skeleton block" style={{ height: 26, width: '62%', borderRadius: 6 }} /> : k.value}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-3.5 mb-3.5">
        {/* Revenue chart */}
        <Panel className="p-5 adm-rise adm-rise-3">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <Eyebrow>Revenue</Eyebrow>
              <p className="adm-display adm-num text-[22px] mt-1.5 leading-none" style={{ color: 'var(--adm-text)' }}>
                {inr(stats.totalRevenue)}
              </p>
            </div>
            <span className="adm-badge adm-badge-mute">Last 7 days</span>
          </div>

          <div className="flex items-end gap-2.5" style={{ height: 158 }}>
            {stats.last7Days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                <span
                  className="adm-num text-[10px] tabular-nums truncate w-full text-center"
                  style={{ color: d.value ? 'var(--adm-text-2)' : 'transparent' }}
                >
                  {d.value ? inrShort(d.value) : '—'}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: 108 }}>
                  <div
                    title={`${d.label}: ${inr(d.value)}`}
                    className={d.value ? 'adm-bar' : 'adm-bar-empty'}
                    style={{
                      width: '100%',
                      maxWidth: 34,
                      height: d.value ? `${Math.max((d.value / peak) * 100, 4)}%` : 3,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--adm-text-3)' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Payment mix */}
        <Panel className="p-5 adm-rise adm-rise-4 flex flex-col">
          <Eyebrow>Payment mix</Eyebrow>
          <div className="space-y-4 mt-5 flex-1">
            {MIX.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px]" style={{ color: 'var(--adm-text-2)' }}>{m.label}</span>
                  <span className="adm-display adm-num text-[13px]" style={{ color: 'var(--adm-text)' }}>{m.pct}%</span>
                </div>
                <div className="adm-meter">
                  <span style={{ width: `${m.pct}%`, background: m.tint }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 pt-4 text-[11px]" style={{ borderTop: '1px solid var(--adm-line)', color: 'var(--adm-text-3)' }}>
            Across {stats.paymentMix.total} order{stats.paymentMix.total === 1 ? '' : 's'}
          </p>
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel className="overflow-hidden adm-rise adm-rise-4">
        <div className="flex items-center justify-between px-5 h-12" style={{ borderBottom: '1px solid var(--adm-line)' }}>
          <Eyebrow>Recent orders</Eyebrow>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--adm-accent)' }}
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>

        {!loading && orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No orders yet"
            message="They appear here the moment a customer completes checkout."
          />
        ) : (
          <>
          <p className="adm-swipe-hint"><MoveHorizontal size={11} /> Swipe the table sideways to see every column</p>
          <div className="overflow-x-auto">
            <table className="adm-table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="text-right">Total</th>
                  <th>Pay mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={5} rows={5} />}
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono font-semibold adm-num" style={{ color: 'var(--adm-accent)' }}>
                      {o.order_number}
                    </td>
                    <td style={{ color: 'var(--adm-text)' }}>{o.customer_name || o.customer_email || '—'}</td>
                    <td className="text-right adm-num font-semibold" style={{ color: 'var(--adm-text)' }}>{inr(o.total)}</td>
                    <td>{o.payment_mode.replace('_', ' ')}</td>
                    <td>
                      <span className={`adm-badge ${STATUS_TONE[o.status] ?? 'adm-badge-mute'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Panel>
    </div>
  )
}
