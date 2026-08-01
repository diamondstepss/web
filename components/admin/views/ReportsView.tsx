'use client'

import { BarChart2 } from 'lucide-react'
import { computeStats } from '@/lib/admin'
import { inr, Panel, Eyebrow, PageHeading, ErrorNote, EmptyState, useAdminOrders } from '@/components/admin/shared'

export default function ReportsView() {
  const { orders, loading, error } = useAdminOrders()
  const stats = computeStats(orders)

  // Cancelled orders are excluded from revenue but counted in the rate below.
  const byBrand = new Map<string, number>()
  const byProduct = new Map<string, { qty: number; revenue: number }>()
  for (const o of orders) {
    if (o.status === 'CANCELLED') continue
    for (const it of o.order_items ?? []) {
      const line = Number(it.price) * it.qty
      byBrand.set(it.brand, (byBrand.get(it.brand) ?? 0) + line)
      const prev = byProduct.get(it.title) ?? { qty: 0, revenue: 0 }
      byProduct.set(it.title, { qty: prev.qty + it.qty, revenue: prev.revenue + line })
    }
  }
  const brands = [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const peak = Math.max(...brands.map(([, v]) => v), 1)
  const products = [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6)

  const cancelled = orders.filter((o) => o.status === 'CANCELLED').length
  const cancelRate = orders.length ? Math.round((cancelled / orders.length) * 100) : 0

  const KPIS: [string, string, string?][] = [
    ['Total revenue', inr(stats.totalRevenue)],
    ['Orders', String(stats.totalOrders)],
    ['Avg order value', inr(stats.avgOrderValue)],
    ['Cancellation rate', `${cancelRate}%`, cancelRate > 15 ? 'bad' : undefined],
  ]

  const hasSales = brands.length > 0

  return (
    <div>
      <PageHeading
        title="Reports"
        description="Lifetime totals across every order. Cancelled orders are excluded from revenue."
        meta={loading ? 'Loading…' : 'Live'}
        live={!loading && !error}
      />

      <ErrorNote>{error}</ErrorNote>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        {KPIS.map(([label, value, tone], i) => (
          <Panel key={label} className={`adm-stat p-4 adm-rise adm-rise-${i + 1}`}>
            <Eyebrow>{label}</Eyebrow>
            <p
              className="adm-display adm-num text-[30px] leading-none mt-3"
              style={{ color: tone === 'bad' ? 'var(--adm-bad)' : 'var(--adm-text)' }}
            >
              {loading ? <span className="skeleton block" style={{ height: 26, width: '62%', borderRadius: 6 }} /> : value}
            </p>
          </Panel>
        ))}
      </div>

      {!loading && !hasSales ? (
        <Panel className="adm-rise adm-rise-3">
          <EmptyState
            icon={BarChart2}
            title="No sales to report yet"
            message="Once orders start coming in, revenue by brand and your best sellers appear here."
          />
        </Panel>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3.5">
          <Panel className="p-5 adm-rise adm-rise-3">
            <Eyebrow className="mb-5">Revenue by brand</Eyebrow>
            <div className="space-y-3.5">
              {brands.map(([brand, value]) => (
                <div key={brand}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px]" style={{ color: 'var(--adm-text-2)' }}>{brand}</span>
                    <span className="adm-display adm-num text-[12.5px]" style={{ color: 'var(--adm-text)' }}>{inr(value)}</span>
                  </div>
                  <div className="adm-meter">
                    <span style={{ width: `${(value / peak) * 100}%`, background: 'var(--adm-accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5 adm-rise adm-rise-4">
            <Eyebrow className="mb-5">Best sellers</Eyebrow>
            <div className="space-y-1">
              {products.map(([title, d], i) => (
                <div
                  key={title}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i === products.length - 1 ? 'none' : '1px solid var(--adm-line)' }}
                >
                  <span
                    className="adm-display adm-num text-[11px] flex items-center justify-center shrink-0"
                    style={{ width: 21, height: 21, borderRadius: 6, background: 'var(--adm-inset)', color: 'var(--adm-text-3)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-[12px] truncate" style={{ color: 'var(--adm-text)' }}>{title}</span>
                  <span className="adm-num text-[11px] shrink-0" style={{ color: 'var(--adm-text-3)' }}>×{d.qty}</span>
                  <span className="adm-display adm-num text-[12.5px] shrink-0" style={{ color: 'var(--adm-text)' }}>{inr(d.revenue)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
