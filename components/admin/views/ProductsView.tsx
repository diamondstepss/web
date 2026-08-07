'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Star, Search, PackageOpen, ImageOff , MoveHorizontal, X } from 'lucide-react'
import type { DbProduct } from '@/lib/catalog'
import {
  adminFetchProducts,
  adminFetchCategories,
  deleteProduct,
  toggleFeatured,
  toggleActive,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import {
  inr,
  shortDate,
  fullDateTime,
  ToggleSwitch,
  Panel,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
} from '@/components/admin/shared'

type StatusFilter = 'ALL' | 'LIVE' | 'DRAFT'
type FeaturedFilter = 'ALL' | 'YES' | 'NO'
type StockFilter = 'ALL' | 'IN' | 'LOW' | 'OUT'
type SortKey = 'position' | 'newest' | 'oldest' | 'updated' | 'price_desc' | 'price_asc' | 'stock_asc' | 'name'

export default function ProductsView() {
  const [rows, setRows] = useState<DbProduct[]>([])
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [brandFilter, setBrandFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('ALL')
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL')
  const [sort, setSort] = useState<SortKey>('position')

  const confirm = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [products, categories] = await Promise.all([adminFetchProducts(), adminFetchCategories()])
      setRows(products)
      setCategoryNames(Object.fromEntries(categories.map((c) => [c.slug, c.name])))
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
  const categoriesOf = (p: DbProduct) =>
    (p.product_categories ?? []).map((pc) => pc.categories?.slug).filter((s): s is string => Boolean(s))

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

  const brands = useMemo(() => [...new Set(rows.map((p) => p.brand))].sort(), [rows])
  const categoryOptions = useMemo(() => {
    const slugs = new Set(rows.flatMap(categoriesOf))
    return [...slugs].sort((a, b) => (categoryNames[a] ?? a).localeCompare(categoryNames[b] ?? b))
  }, [rows, categoryNames])

  const filtersActive =
    brandFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    featuredFilter !== 'ALL' ||
    stockFilter !== 'ALL'

  const clearFilters = () => {
    setBrandFilter('ALL')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
    setFeaturedFilter('ALL')
    setStockFilter('ALL')
  }

  const needle = q.trim().toLowerCase()
  const shown = rows
    .filter((p) => !needle || [p.title, p.brand, p.slug].some((v) => v?.toLowerCase().includes(needle)))
    .filter((p) => brandFilter === 'ALL' || p.brand === brandFilter)
    .filter((p) => categoryFilter === 'ALL' || categoriesOf(p).includes(categoryFilter))
    .filter((p) => statusFilter === 'ALL' || (statusFilter === 'LIVE' ? p.is_active : !p.is_active))
    .filter((p) => featuredFilter === 'ALL' || (featuredFilter === 'YES' ? p.is_featured : !p.is_featured))
    .filter((p) => {
      if (stockFilter === 'ALL') return true
      if (stockFilter === 'OUT') return p.stock === 0
      if (stockFilter === 'LOW') return p.stock > 0 && p.stock < 5
      return p.stock >= 5 // IN
    })
    .sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.created_at.localeCompare(a.created_at)
        case 'oldest':
          return a.created_at.localeCompare(b.created_at)
        case 'updated':
          return b.updated_at.localeCompare(a.updated_at)
        case 'price_desc':
          return Number(b.price) - Number(a.price)
        case 'price_asc':
          return Number(a.price) - Number(b.price)
        case 'stock_asc':
          return a.stock - b.stock
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return a.position - b.position
      }
    })

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

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3.5 adm-rise adm-rise-1">
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="adm-input" style={{ height: 32, width: 'auto' }}>
            <option value="ALL">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {categoryOptions.length > 0 && (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="adm-input" style={{ height: 32, width: 'auto' }}>
              <option value="ALL">All categories</option>
              {categoryOptions.map((slug) => (
                <option key={slug} value={slug}>{categoryNames[slug] ?? slug}</option>
              ))}
            </select>
          )}

          {([['ALL', 'Any status'], ['LIVE', 'Live'], ['DRAFT', 'Draft']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className="adm-btn"
              style={
                statusFilter === v
                  ? { height: 32, padding: '0 11px', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', border: '1px solid var(--adm-accent-line)' }
                  : { height: 32, padding: '0 11px', color: 'var(--adm-text-2)', border: '1px solid var(--adm-line)' }
              }
            >
              {label}
            </button>
          ))}

          {([['ALL', 'Any'], ['YES', 'Featured'], ['NO', 'Not featured']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFeaturedFilter(v)}
              className="adm-btn"
              style={
                featuredFilter === v
                  ? { height: 32, padding: '0 11px', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', border: '1px solid var(--adm-accent-line)' }
                  : { height: 32, padding: '0 11px', color: 'var(--adm-text-2)', border: '1px solid var(--adm-line)' }
              }
            >
              {label}
            </button>
          ))}

          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)} className="adm-input" style={{ height: 32, width: 'auto' }}>
            <option value="ALL">Any stock</option>
            <option value="IN">In stock (5+)</option>
            <option value="LOW">Low stock (1–4)</option>
            <option value="OUT">Out of stock</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="adm-input" style={{ height: 32, width: 'auto' }}>
            <option value="position">Sort: manual order</option>
            <option value="newest">Sort: newest first</option>
            <option value="oldest">Sort: oldest first</option>
            <option value="updated">Sort: recently updated</option>
            <option value="price_desc">Sort: price, high to low</option>
            <option value="price_asc">Sort: price, low to high</option>
            <option value="stock_asc">Sort: stock, low to high</option>
            <option value="name">Sort: name, A–Z</option>
          </select>

          {filtersActive && (
            <button onClick={clearFilters} className="adm-btn adm-btn-ghost" style={{ height: 32, padding: '0 11px' }}>
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      <Panel className="overflow-hidden adm-rise adm-rise-2">
        {!loading && shown.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={rows.length === 0 ? 'No products yet' : 'Nothing matches'}
            message={
              rows.length === 0
                ? 'Add your first product and it appears on the storefront straight away.'
                : q.trim()
                  ? `No product matches "${q.trim()}".`
                  : 'No product matches these filters.'
            }
            action={
              rows.length === 0 ? (
                <Link href="/admin/products/new" className="adm-btn adm-btn-primary">
                  <Plus size={13} /> New product
                </Link>
              ) : filtersActive ? (
                <button onClick={clearFilters} className="adm-btn adm-btn-primary">
                  <X size={13} /> Clear filters
                </button>
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
                  <th style={{ width: 90 }}>Status</th>
                  <th className="whitespace-nowrap">Created</th>
                  <th className="whitespace-nowrap">Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={10} rows={6} />}
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
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={p.is_active}
                          onChange={() => act(p.id, () => toggleActive(p.id, !p.is_active))}
                          disabled={busy === p.id}
                          label={p.is_active ? `Set ${p.title} to draft` : `Publish ${p.title}`}
                        />
                        <span
                          className="text-[11px] font-medium whitespace-nowrap"
                          style={{ color: p.is_active ? 'var(--adm-ok)' : 'var(--adm-text-3)' }}
                          title={p.is_active ? 'Visible on the storefront' : 'Hidden from the storefront'}
                        >
                          {p.is_active ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-[11.5px]" style={{ color: 'var(--adm-text-3)' }} title={fullDateTime(p.created_at)}>
                      {shortDate(p.created_at)}
                    </td>
                    <td className="whitespace-nowrap text-[11.5px]" style={{ color: 'var(--adm-text-3)' }} title={fullDateTime(p.updated_at)}>
                      {shortDate(p.updated_at)}
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
