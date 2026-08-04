'use client'

import Link from 'next/link'
import { SearchX } from 'lucide-react'
import PageHero from '@/components/PageHero'
import ProductCard from '@/components/ProductCard'
import { FilterPanel, FilterDrawer, ActiveChips, SortSelect } from '@/components/ProductFilters'
import { useProductFilters } from '@/lib/useProductFilters'
import type { Product } from '@/lib/types'

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export function ShopPage({ products: incoming = [] }: { products?: Product[] }) {
  const { filters, setFilters, clear, facets, results, activeCount } = useProductFilters(incoming)

  // The hero lede quoted fixed figures that drifted from the catalog; derive it.
  const lede =
    incoming.length > 0
      ? `${facets.brands.length} brand${facets.brands.length === 1 ? '' : 's'}, UK ${facets.sizes[0]?.value ?? 6} to ${
          facets.sizes[facets.sizes.length - 1]?.value ?? 11
        }, ${inr(facets.priceMin)} to ${inr(facets.priceMax)}.`
      : 'Our full catalog.'

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Everything in stock"
        title="Shop All"
        lede={lede}
        crumbs={[{ label: 'Shop' }]}
        image="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1440&h=460&fit=crop&auto=format"
        compact
      />

      {/* Toolbar */}
      <div
        className="sticky z-30"
        style={{ top: 61, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong>
            {results.length === incoming.length ? ' products' : ` of ${incoming.length} products`}
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
      </div>

      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6 grid lg:grid-cols-[248px_minmax(0,1fr)] gap-10">
          <aside className="hidden lg:block">
            <div className="sticky" style={{ top: 130 }}>
              <FilterPanel filters={filters} facets={facets} onChange={setFilters} />
            </div>
          </aside>

          <div className="min-w-0">
            <ActiveChips filters={filters} onChange={setFilters} onClear={clear} />

            {results.length === 0 ? (
              <div className="text-center py-20">
                <SearchX size={30} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
                <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Nothing matches those filters
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  {activeCount} filter{activeCount === 1 ? '' : 's'} applied. Try removing one.
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

            <div className="text-center mt-14">
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Looking for something specific?
              </p>
              <Link
                href="/search"
                className="inline-block px-8 py-3.5 text-sm font-black uppercase tracking-widest border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
              >
                Search the store
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ShopPage
