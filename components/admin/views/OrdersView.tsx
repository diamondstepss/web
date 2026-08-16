'use client'

import { useState } from 'react'
import { Inbox, Search , MoveHorizontal } from 'lucide-react'
import { updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/admin'
import { STEP_LABELS_PICKUP, type OrderStatus } from '@/lib/types'
import { useConfirm } from '@/components/ConfirmDialog'
import {
  inr,
  Panel,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
  useAdminOrders,
} from '@/components/admin/shared'

/** Bulk targets an admin would plausibly apply to a batch at once. */
const BULK_ACTIONS: { to: OrderStatus; label: string; danger?: boolean }[] = [
  { to: 'PACKED', label: 'Mark packed' },
  { to: 'SHIPPED', label: 'Mark shipped' },
  { to: 'DELIVERED', label: 'Mark delivered' },
  { to: 'CANCELLED', label: 'Cancel', danger: true },
]

/** Each status offers exactly one forward move, so the flow can't be skipped. */
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; primary: boolean }>> = {
  CONFIRMED: { to: 'PACKED', label: 'Mark packed', primary: true },
  PACKED: { to: 'SHIPPED', label: 'Ship', primary: true },
  SHIPPED: { to: 'DELIVERED', label: 'Delivered', primary: false },
}

// Pickup skips the shipped/out-for-delivery leg — there's no courier, just
// "ready" and "handed over."
const NEXT_STEP_PICKUP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; primary: boolean }>> = {
  CONFIRMED: { to: 'PACKED', label: 'Mark ready for pickup', primary: true },
  PACKED: { to: 'DELIVERED', label: 'Mark picked up', primary: true },
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const confirm = useConfirm()

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

  const cancelOne = async (id: string, orderNumber: string) => {
    const ok = await confirm({
      title: 'Cancel this order?',
      message: `Order ${orderNumber} will be cancelled and its reserved stock released. This cannot be undone.`,
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
    })
    if (!ok) return
    await advance(id, 'CANCELLED')
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

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allShownSelected = shown.length > 0 && shown.every((o) => selected.has(o.id))
  const toggleAllShown = () => {
    setSelected((prev) => {
      if (allShownSelected) {
        const next = new Set(prev)
        shown.forEach((o) => next.delete(o.id))
        return next
      }
      const next = new Set(prev)
      shown.forEach((o) => next.add(o.id))
      return next
    })
  }

  const runBulk = async (status: OrderStatus) => {
    if (status === 'CANCELLED') {
      const ok = await confirm({
        title: `Cancel ${selected.size} order${selected.size === 1 ? '' : 's'}?`,
        message: 'Each will be cancelled and its reserved stock released. This cannot be undone.',
        confirmLabel: 'Cancel orders',
        cancelLabel: 'Keep orders',
      })
      if (!ok) return
    }
    setBulkBusy(true)
    setActionError(null)
    try {
      const { updated, failed } = await bulkUpdateOrderStatus([...selected], status)
      if (failed.length) {
        setActionError(
          `Updated ${updated} order${updated === 1 ? '' : 's'} — ${failed.length} couldn't be changed (already at that status, shipped, or cancelled).`,
        )
      }
      setSelected(new Set())
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update those orders.')
    } finally {
      setBulkBusy(false)
    }
  }

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
            onChange={(e) => {
              setQ(e.target.value)
              setSelected(new Set())
            }}
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
            onClick={() => {
              setFilter(f)
              setSelected(new Set())
            }}
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

      {selected.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 mb-3.5 px-3.5 py-2.5 adm-rise adm-rise-1"
          style={{ background: 'var(--adm-accent-soft)', border: '1px solid var(--adm-accent-line)', borderRadius: 'var(--adm-r-sm)' }}
        >
          <span className="text-[12px] font-semibold mr-1" style={{ color: 'var(--adm-accent)' }}>
            {selected.size} selected
          </span>
          {BULK_ACTIONS.map((a) => (
            <button
              key={a.to}
              onClick={() => runBulk(a.to)}
              disabled={bulkBusy}
              className={`adm-btn ${a.danger ? 'adm-btn-danger' : 'adm-btn-ghost'}`}
              style={{ height: 28, padding: '0 11px' }}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            disabled={bulkBusy}
            className="adm-btn adm-btn-ghost"
            style={{ height: 28, padding: '0 11px', marginLeft: 'auto' }}
          >
            {bulkBusy ? 'Working…' : 'Clear selection'}
          </button>
        </div>
      )}

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
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allShownSelected}
                      onChange={toggleAllShown}
                      aria-label="Select all shown orders"
                    />
                  </th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                  <th>Pay mode</th>
                  <th>Fulfillment</th>
                  <th className="text-right">Due on delivery</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={10} rows={6} />}
                {shown.map((o) => {
                  const due = Number(o.amount_due_on_delivery ?? 0)
                  const isPickup = o.fulfillment_type === 'PICKUP'
                  const step = (isPickup ? NEXT_STEP_PICKUP : NEXT_STEP)[o.status as OrderStatus]
                  const cancellable = o.status === 'CONFIRMED' || o.status === 'PACKED'
                  return (
                    <tr key={o.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggleOne(o.id)}
                          aria-label={`Select order ${o.order_number}`}
                        />
                      </td>
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
                      <td>
                        <span className={`adm-badge ${isPickup ? 'adm-badge-acc' : 'adm-badge-mute'}`}>
                          {isPickup ? 'Pickup' : 'Delivery'}
                        </span>
                      </td>
                      <td className="text-right adm-num font-semibold" style={{ color: due > 0 ? 'var(--adm-warn)' : 'var(--adm-text-3)' }}>
                        {due > 0 ? inr(due) : '—'}
                      </td>
                      <td>
                        <span className={`adm-badge ${STATUS_TONE[o.status] ?? 'adm-badge-mute'}`}>
                          {isPickup ? (STEP_LABELS_PICKUP[o.status] ?? o.status.replace(/_/g, ' ')) : o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          {cancellable && (
                            <button
                              onClick={() => cancelOne(o.id, o.order_number)}
                              disabled={busy === o.id}
                              className="adm-btn adm-btn-ghost"
                              style={{ height: 28, padding: '0 11px', color: 'var(--adm-bad)' }}
                            >
                              Cancel
                            </button>
                          )}
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
                        </div>
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
