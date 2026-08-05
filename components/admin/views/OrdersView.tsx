'use client'

import { useState } from 'react'
import { Inbox, Search , MoveHorizontal } from 'lucide-react'
import { updateOrderStatus } from '@/lib/admin'
import type { OrderStatus } from '@/lib/types'
import {
  inr,
  Panel,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
  useAdminOrders,
} from '@/components/admin/shared'

/** Each status offers exactly one forward move, so the flow can't be skipped. */
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; primary: boolean }>> = {
  CONFIRMED: { to: 'PACKED', label: 'Mark packed', primary: true },
  PACKED: { to: 'SHIPPED', label: 'Ship', primary: true },
  SHIPPED: { to: 'DELIVERED', label: 'Delivered', primary: false },
}

const STATUS_TONE: Record<string, string> = {
  DELIVERED: 'adm-badge-ok',
  SHIPPED: 'adm-badge-acc',
  PACKED: 'adm-badge-acc',
  CONFIRMED: 'adm-badge-warn',
  CANCELLED: 'adm-badge-bad',
}

const PAY_TONE: Record<string, string> = {
  PREPAID: 'adm-badge-ok',
  COD: 'adm-badge-warn',
  PARTIAL_COD: 'adm-badge-acc',
}

const FILTERS = ['ALL', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export default function OrdersView() {
  const { orders, loading, error, reload } = useAdminOrders()
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL')
  const [q, setQ] = useState('')

  const advance = async (id: string, next: OrderStatus) => {
    setBusy(id)
    setActionError(null)
    try {
      await updateOrderStatus(id, next)
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update that order.')
    } finally {
      setBusy(null)
    }
  }

  const needle = q.trim().toLowerCase()
  const shown = orders.filter((o) => {
    if (filter !== 'ALL' && o.status !== filter) return false
    if (!needle) return true
    return [o.order_number, o.customer_name, o.customer_email].some((v) =>
      v?.toLowerCase().includes(needle),
    )
  })

  const countFor = (f: (typeof FILTERS)[number]) =>
    f === 'ALL' ? orders.length : orders.filter((o) => o.status === f).length

  return (
    <div>
      <PageHeading
        title="Orders"
        description="Move an order forward one step at a time — confirmed, packed, shipped, delivered."
        meta={loading ? 'Loading…' : `${orders.length} total`}
        live={!loading && !error}
      >
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text-3)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order or customer"
            aria-label="Search orders"
            className="adm-input"
            style={{ width: 'min(220px, 60vw)', paddingLeft: 30, height: 34 }}
          />
        </div>
      </PageHeading>

      <ErrorNote>{error ?? actionError}</ErrorNote>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5 mb-3.5 adm-rise adm-rise-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="adm-btn"
            style={
              filter === f
                ? { height: 30, padding: '0 12px', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', border: '1px solid var(--adm-accent-line)' }
                : { height: 30, padding: '0 12px', color: 'var(--adm-text-2)', border: '1px solid var(--adm-line)' }
            }
          >
            {f === 'ALL' ? 'All' : f.replace(/_/g, ' ')}
            <span className="adm-num opacity-60">{countFor(f)}</span>
          </button>
        ))}
      </div>

      <Panel className="overflow-hidden adm-rise adm-rise-2">
        {!loading && shown.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={orders.length === 0 ? 'No orders yet' : 'Nothing matches'}
            message={
              orders.length === 0
                ? 'They appear here the moment a customer completes checkout.'
                : 'Try a different status filter or search term.'
            }
          />
        ) : (
          <>
          <p className="adm-swipe-hint"><MoveHorizontal size={11} /> Swipe the table sideways to see every column</p>
          <div className="overflow-x-auto">
            <table className="adm-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                  <th>Pay mode</th>
                  <th className="text-right">Due on delivery</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={8} rows={6} />}
                {shown.map((o) => {
                  const due = Number(o.amount_due_on_delivery ?? 0)
                  const step = NEXT_STEP[o.status as OrderStatus]
                  return (
                    <tr key={o.id}>
                      <td className="font-mono font-semibold adm-num" style={{ color: 'var(--adm-accent)' }}>
                        {o.order_number}
                      </td>
                      <td style={{ color: 'var(--adm-text)' }}>{o.customer_name || o.customer_email || '—'}</td>
                      <td className="adm-num whitespace-nowrap">
                        {new Date(o.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="text-right adm-num font-semibold" style={{ color: 'var(--adm-text)' }}>{inr(o.total)}</td>
                      <td>
                        <span className={`adm-badge ${PAY_TONE[o.payment_mode] ?? 'adm-badge-mute'}`}>
                          {o.payment_mode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right adm-num font-semibold" style={{ color: due > 0 ? 'var(--adm-warn)' : 'var(--adm-text-3)' }}>
                        {due > 0 ? inr(due) : '—'}
                      </td>
                      <td>
                        <span className={`adm-badge ${STATUS_TONE[o.status] ?? 'adm-badge-mute'}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        {step && (
                          <button
                            onClick={() => advance(o.id, step.to)}
                            disabled={busy === o.id}
                            className={`adm-btn ${step.primary ? 'adm-btn-primary' : 'adm-btn-ghost'}`}
                            style={{ height: 28, padding: '0 11px' }}
                          >
                            {busy === o.id ? 'Saving…' : step.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Panel>
    </div>
  )
}
