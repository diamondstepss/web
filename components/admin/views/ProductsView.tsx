'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Star, Search, PackageOpen, ImageOff , MoveHorizontal } from 'lucide-react'
import type { DbProduct } from '@/lib/catalog'
import {
  adminFetchProducts,
  deleteProduct,
  toggleFeatured,
  toggleActive,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import { inr, Panel, PageHeading, ErrorNote, EmptyState, SkeletonRows } from '@/components/admin/shared'

export default function ProductsView() {
  const [rows, setRows] = useState<DbProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const confirm = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminFetchProducts())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pct = (mrp: number, price: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0)

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id)
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setBusy(null)
    }
  }

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? rows.filter((p) => [p.title, p.brand, p.slug].some((v) => v?.toLowerCase().includes(needle)))
    : rows

  const live = rows.filter((p) => p.is_active).length
  const outOfStock = rows.filter((p) => p.stock === 0).length

  return (
    <div>
      <PageHeading
        title="Products"
        description="Everything in the catalog. Toggle a product live or draft, or star it to feature it on the homepage."
        meta={loading ? 'Loading…' : `${live} live · ${rows.length} total`}
      >
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text-3)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="adm-input"
            style={{ width: 'min(220px, 60vw)', paddingLeft: 30, height: 34 }}
          />
        </div>
        <Link href="/admin/products/new" className="adm-btn adm-btn-primary">
          <Plus size={13} /> New product
        </Link>
      </PageHeading>

      <ErrorNote>{error}</ErrorNote>

      {outOfStock > 0 && !loading && (
        <p
          className="text-[12px] px-4 py-2.5 mb-3.5 adm-rise adm-rise-1"
          style={{
            background: 'color-mix(in srgb, var(--adm-warn) 11%, transparent)',
            border: '1px solid color-mix(in srgb, var(--adm-warn) 26%, transparent)',
            color: 'var(--adm-warn)',
            borderRadius: 'var(--adm-r-sm)',
          }}
        >
          {outOfStock === 1
            ? '1 product is out of stock — customers can still see it but can’t buy.'
            : `${outOfStock} products are out of stock — customers can still see them but can’t buy.`}
        </p>
      )}

      <Panel className="overflow-hidden adm-rise adm-rise-2">
        {!loading && shown.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={rows.length === 0 ? 'No products yet' : 'Nothing matches'}
            message={
              rows.length === 0
                ? 'Add your first product and it appears on the storefront straight away.'
                : `No product matches "${q.trim()}".`
            }
            action={
              rows.length === 0 ? (
                <Link href="/admin/products/new" className="adm-btn adm-btn-primary">
                  <Plus size={13} /> New product
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
          <p className="adm-swipe-hint"><MoveHorizontal size={11} /> Swipe the table sideways to see every column</p>
          <div className="overflow-x-auto">
            <table className="adm-table" style={{ minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={{ width: 52 }} />
                  <th>Product</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Off</th>
                  <th className="text-right">Stock</th>
                  <th style={{ width: 60 }}>Featured</th>
                  <th style={{ width: 70 }}>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={8} rows={6} />}
                {shown.map((p) => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.55 }}>
                    <td>
                      <div
                        className="flex items-center justify-center overflow-hidden"
                        style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--adm-inset)', border: '1px solid var(--adm-line)' }}
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={14} style={{ color: 'var(--adm-text-3)' }} />
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="font-semibold text-[12.5px]" style={{ color: 'var(--adm-text)' }}>{p.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>{p.brand}</p>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className="adm-num font-semibold" style={{ color: 'var(--adm-text)' }}>{inr(p.price)}</span>
                      {Number(p.mrp) > Number(p.price) && (
                        <span className="adm-num line-through ml-1.5 text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
                          {inr(p.mrp)}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {pct(Number(p.mrp), Number(p.price)) > 0 ? (
                        <span className="adm-num font-semibold" style={{ color: 'var(--adm-accent)' }}>
                          {pct(Number(p.mrp), Number(p.price))}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--adm-text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span
                        className="adm-num font-semibold"
                        style={{ color: p.stock === 0 ? 'var(--adm-bad)' : p.stock < 5 ? 'var(--adm-warn)' : 'var(--adm-text)' }}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => act(p.id, () => toggleFeatured(p.id, !p.is_featured))}
                        disabled={busy === p.id}
                        className="adm-icon-btn"
                        aria-label={p.is_featured ? `Remove ${p.title} from featured` : `Feature ${p.title}`}
                        title={p.is_featured ? 'Featured on homepage' : 'Not featured'}
                      >
                        <Star
                          size={15}
                          style={{
                            color: p.is_featured ? 'var(--adm-accent)' : 'var(--adm-text-3)',
                            fill: p.is_featured ? 'var(--adm-accent)' : 'transparent',
                          }}
                        />
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => act(p.id, () => toggleActive(p.id, !p.is_active))}
                        disabled={busy === p.id}
                        className={`adm-badge ${p.is_active ? 'adm-badge-ok' : 'adm-badge-mute'}`}
                        title={p.is_active ? 'Visible on the storefront' : 'Hidden from the storefront'}
                      >
                        {p.is_active ? 'Live' : 'Draft'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1.5 justify-end">
                        <Link href={`/admin/products/${p.id}`} className="adm-btn adm-btn-ghost" style={{ height: 28, padding: '0 11px' }}>
                          Edit
                        </Link>
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete product?',
                              message: `"${p.title}" and its images will be removed from the store. This cannot be undone.`,
                              confirmLabel: 'Delete product',
                            })
                            if (ok) void act(p.id, () => deleteProduct(p.id))
                          }}
                          className="adm-btn adm-btn-danger"
                          style={{ height: 28, padding: '0 11px' }}
                        >
                          Delete
                        </button>
                      </div>
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
