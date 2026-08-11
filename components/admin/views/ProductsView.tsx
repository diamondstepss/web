'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Star, Search, PackageOpen, ImageOff , MoveHorizontal, X } from 'lucide-react'
import type { DbProduct } from '@/lib/catalog'
import {
  adminFetchProducts,
  adminFetchCategories,
  adminFetchBrands,
  adminFetchProductStats,
  deleteProduct,
  toggleFeatured,
  toggleActive,
  deleteProductMany,
  toggleFeaturedMany,
  toggleActiveMany,
  type ProductSort,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import {
  inr,
  shortDate,
  shortTime,
  fullDateTime,
  ToggleSwitch,
  Pagination,
  Panel,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
} from '@/components/admin/shared'

type StatusFilter = 'ALL' | 'LIVE' | 'DRAFT'
type FeaturedFilter = 'ALL' | 'YES' | 'NO'
type StockFilter = 'ALL' | 'IN' | 'LOW' | 'OUT'

export default function ProductsView() {
  const [rows, setRows] = useState<DbProduct[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<{ total: number; live: number; outOfStock: number } | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('ALL')
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL')
  const [sort, setSort] = useState<ProductSort>('position')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const confirm = useConfirm()

  // Typing shouldn't fire a query per keystroke — everything else (a
  // dropdown, a status pill) already only changes on a deliberate click.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  // Any filter change invalidates whatever page you were on — page 4 of a
  // narrower result set may not exist. Adjusted during render rather than in
  // an effect — react.dev's own pattern for "reset state when an input
  // changes," comparing against the last-seen signature instead of reacting
  // to it after the fact.
  const filterSignature = JSON.stringify([
    debouncedQ, brandFilter, categoryFilter, statusFilter, featuredFilter, stockFilter, sort, perPage,
  ])
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature)
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature)
    setPage(1)
    setSelected(new Set())
  }

  // Brands, categories and the whole-catalog counts describe the catalog,
  // not the current page — fetched once, independent of paging/filtering.
  useEffect(() => {
    Promise.all([adminFetchBrands(), adminFetchCategories(), adminFetchProductStats()])
      .then(([b, categories, s]) => {
        setBrands(b)
        setCategoryNames(Object.fromEntries(categories.map((c) => [c.slug, c.name])))
        setStats(s)
      })
      .catch(() => {
        /* filter options and the stats banner are non-essential — the table itself still loads */
      })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { rows, total } = await adminFetchProducts({
        search: debouncedQ || undefined,
        brand: brandFilter === 'ALL' ? undefined : brandFilter,
        categorySlug: categoryFilter === 'ALL' ? undefined : categoryFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        featured: featuredFilter === 'ALL' ? undefined : featuredFilter === 'YES',
        stock: stockFilter === 'ALL' ? undefined : stockFilter,
        sort,
        page,
        perPage,
      })
      setRows(rows)
      setTotal(total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, brandFilter, categoryFilter, statusFilter, featuredFilter, stockFilter, sort, page, perPage])

  useEffect(() => {
    void load()
  }, [load])

  // A delete can empty the last page — land somewhere that still has rows
  // rather than showing "no results" for a page that no longer exists. Same
  // during-render adjustment as the filter reset above, keyed on totalPages
  // rather than on total/perPage individually so it only fires when the
  // page count actually changes, not on every row-count fluctuation.
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const [prevTotalPages, setPrevTotalPages] = useState(totalPages)
  if (totalPages !== prevTotalPages) {
    setPrevTotalPages(totalPages)
    if (page > totalPages) setPage(totalPages)
  }

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

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allRowsSelected = rows.length > 0 && rows.every((p) => selected.has(p.id))
  const toggleAllRows = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allRowsSelected) rows.forEach((p) => next.delete(p.id))
      else rows.forEach((p) => next.add(p.id))
      return next
    })
  }

  const bulkAct = async (fn: () => Promise<unknown>) => {
    setBulkBusy(true)
    setError(null)
    try {
      await fn()
      setSelected(new Set())
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk action failed.')
    } finally {
      setBulkBusy(false)
    }
  }

  const bulkDelete = async () => {
    const ids = [...selected]
    const ok = await confirm({
      title: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}?`,
      message: 'Their images will be removed from the store too. This cannot be undone.',
      confirmLabel: `Delete ${ids.length === 1 ? 'product' : 'products'}`,
    })
    if (!ok) return
    await bulkAct(() => deleteProductMany(ids))
  }

  const categoryOptions = Object.keys(categoryNames).sort((a, b) => categoryNames[a].localeCompare(categoryNames[b]))

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

  return (
    <div>
      <PageHeading
        title="Products"
        description="Everything in the catalog. Toggle a product live or draft, or star it to feature it on the homepage."
        meta={stats ? `${stats.live} live · ${stats.total} total` : undefined}
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

      {stats && stats.outOfStock > 0 && (
        <p
          className="text-[12px] px-4 py-2.5 mb-3.5 adm-rise adm-rise-1"
          style={{
            background: 'color-mix(in srgb, var(--adm-warn) 11%, transparent)',
            border: '1px solid color-mix(in srgb, var(--adm-warn) 26%, transparent)',
            color: 'var(--adm-warn)',
            borderRadius: 'var(--adm-r-sm)',
          }}
        >
          {stats.outOfStock === 1
            ? '1 product is out of stock — customers can still see it but can’t buy.'
            : `${stats.outOfStock} products are out of stock — customers can still see them but can’t buy.`}
        </p>
      )}

      {stats && stats.total > 0 && (
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

          <select value={sort} onChange={(e) => setSort(e.target.value as ProductSort)} className="adm-input" style={{ height: 32, width: 'auto' }}>
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

      {selected.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 mb-3.5 px-3.5 py-2.5 adm-rise adm-rise-1"
          style={{ background: 'var(--adm-accent-soft)', border: '1px solid var(--adm-accent-line)', borderRadius: 'var(--adm-r-sm)' }}
        >
          <span className="text-[12px] font-semibold mr-1" style={{ color: 'var(--adm-accent)' }}>
            {selected.size} selected
          </span>
          <button
            onClick={() => bulkAct(() => toggleActiveMany([...selected], true))}
            disabled={bulkBusy}
            className="adm-btn adm-btn-ghost"
            style={{ height: 28, padding: '0 11px' }}
          >
            Set live
          </button>
          <button
            onClick={() => bulkAct(() => toggleActiveMany([...selected], false))}
            disabled={bulkBusy}
            className="adm-btn adm-btn-ghost"
            style={{ height: 28, padding: '0 11px' }}
          >
            Set draft
          </button>
          <button
            onClick={() => bulkAct(() => toggleFeaturedMany([...selected], true))}
            disabled={bulkBusy}
            className="adm-btn adm-btn-ghost"
            style={{ height: 28, padding: '0 11px' }}
          >
            Feature
          </button>
          <button
            onClick={() => bulkAct(() => toggleFeaturedMany([...selected], false))}
            disabled={bulkBusy}
            className="adm-btn adm-btn-ghost"
            style={{ height: 28, padding: '0 11px' }}
          >
            Unfeature
          </button>
          <button
            onClick={bulkDelete}
            disabled={bulkBusy}
            className="adm-btn adm-btn-danger"
            style={{ height: 28, padding: '0 11px' }}
          >
            Delete
          </button>
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
        {!loading && total === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={stats?.total === 0 ? 'No products yet' : 'Nothing matches'}
            message={
              stats?.total === 0
                ? 'Add your first product and it appears on the storefront straight away.'
                : q.trim()
                  ? `No product matches "${q.trim()}".`
                  : 'No product matches these filters.'
            }
            action={
              stats?.total === 0 ? (
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
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allRowsSelected}
                      onChange={toggleAllRows}
                      aria-label="Select all products on this page"
                    />
                  </th>
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
                {loading && <SkeletonRows cols={11} rows={6} />}
                {!loading && rows.map((p) => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.55 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.title}`}
                      />
                    </td>
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
                    <td className="whitespace-nowrap" title={fullDateTime(p.created_at)}>
                      <p className="text-[11.5px]" style={{ color: 'var(--adm-text-2)' }}>{shortDate(p.created_at)}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>{shortTime(p.created_at)}</p>
                    </td>
                    <td className="whitespace-nowrap" title={fullDateTime(p.updated_at)}>
                      <p className="text-[11.5px]" style={{ color: 'var(--adm-text-2)' }}>{shortDate(p.updated_at)}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>{shortTime(p.updated_at)}</p>
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
          <Pagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
          </>
        )}
      </Panel>
    </div>
  )
}
