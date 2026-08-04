'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, TrendingUp, X } from 'lucide-react'
import PageHero from '@/components/PageHero'
import ProductCard from '@/components/ProductCard'
import { FilterPanel, FilterDrawer, ActiveChips, SortSelect } from '@/components/ProductFilters'
import { useProductFilters } from '@/lib/useProductFilters'
import type { Product } from '@/lib/types'

/** Matches on brand, title and category so "running" finds the running shoes. */
function matches(p: Product, q: string): boolean {
  const needle = q.toLowerCase()
  return (
    p.title.toLowerCase().includes(needle) ||
    p.brand.toLowerCase().includes(needle) ||
    (p.categories ?? []).some((c) => c.replace(/-/g, ' ').includes(needle))
  )
}

export function SearchPage({ products = [] }: { products?: Product[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const query = params.get('q') ?? ''
  const [val, setVal] = useState(query)

  // Narrow by the query first; the filter sidebar then works on those matches.
  const matched = useMemo(
    () => (query ? products.filter((p) => matches(p, query)) : []),
    [products, query],
  )

  const { filters, setFilters, clear, facets, results, activeCount } = useProductFilters(matched)

  // Suggestions come from the catalog, so every one returns something. The old
  // hardcoded lists linked to brands the shop doesn't stock.
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].filter(Boolean).sort(),
    [products],
  )
  const trending = useMemo(
    () => products.filter((p) => p.isNew || (p.discount ?? 0) >= 30).slice(0, 6).map((p) => p.title),
    [products],
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (val.trim()) router.push(`/search?q=${encodeURIComponent(val.trim())}`)
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Find your pair"
        title={query ? `"${query}"` : 'Search'}
        lede={
          query
            ? `${results.length} product${results.length === 1 ? '' : 's'} matched your search.`
            : undefined
        }
        crumbs={[{ label: 'Search' }]}
        compact
      >
        <form onSubmit={submit} className="flex gap-px max-w-2xl" style={{ background: 'var(--border)' }}>
          <div className="relative flex-1">
            <Search size={17} className="absolute top-1/2 -translate-y-1/2 left-4" style={{ color: 'var(--text-muted)' }} />
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Search sneakers, brands, styles…"
              aria-label="Search products"
              className="w-full pl-11 pr-10 py-4 text-sm outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
            />
            {val && (
              <button
                type="button"
                onClick={() => setVal('')}
                aria-label="Clear search"
                className="absolute top-1/2 -translate-y-1/2 right-3"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-8 text-xs font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
          >
            Search
          </button>
        </form>
      </PageHero>

      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          {query ? (
            matched.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong>
                    {results.length === matched.length ? ' results' : ` of ${matched.length} results`}
                  </p>
                  <div className="flex items-center gap-3">
                    <FilterDrawer
                      filters={filters}
                      facets={facets}
                      onChange={setFilters}
                      onClear={clear}
                      resultCount={results.length}
                    />
                    <SortSelect value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} />
                  </div>
                </div>

                <div className="grid lg:grid-cols-[248px_minmax(0,1fr)] gap-10">
                  <aside className="hidden lg:block">
                    <div className="sticky" style={{ top: 96 }}>
                      <FilterPanel filters={filters} facets={facets} onChange={setFilters} />
                    </div>
                  </aside>

                  <div className="min-w-0">
                    <ActiveChips filters={filters} onChange={setFilters} onClear={clear} />
                    {results.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                          No results with those filters
                        </p>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                          {matched.length} product{matched.length === 1 ? '' : 's'} matched &ldquo;{query}&rdquo;, but{' '}
                          {activeCount} filter{activeCount === 1 ? '' : 's'} narrowed it to nothing.
                        </p>
                        <button
                          onClick={clear}
                          className="px-7 py-3 text-xs font-black uppercase tracking-widest text-white"
                          style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit), Outfit' }}
                        >
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {results.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Search size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.5 }} />
                <h2
                  className="text-2xl font-black uppercase mb-2"
                  style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  No matches for &ldquo;{query}&rdquo;
                </h2>
                <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Check the spelling, try a brand name, or browse everything we have in stock.
                </p>
                <Link
                  href="/shop"
                  className="inline-block px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
                  style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
                >
                  Browse all products
                </Link>
              </div>
            )
          ) : (
            <div className="space-y-12">
              {trending.length > 0 && (
                <div>
                  <p
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                  >
                    <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                    Trending searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((t) => (
                      <Link
                        key={t}
                        href={`/search?q=${encodeURIComponent(t)}`}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors duration-200"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {brands.length > 0 && (
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-widest mb-4"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                  >
                    Shop by brand
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
                    {brands.map((b) => (
                      <Link
                        key={b}
                        href={`/search?q=${encodeURIComponent(b)}`}
                        className="py-6 text-center text-sm font-black uppercase tracking-widest transition-colors duration-200"
                        style={{ background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p
                  className="text-xs font-black uppercase tracking-widest mb-4"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                >
                  Popular right now
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default SearchPage
