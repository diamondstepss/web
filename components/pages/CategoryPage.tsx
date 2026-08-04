'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SearchX } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { FilterPanel, FilterDrawer, ActiveChips, SortSelect } from '@/components/ProductFilters'
import { useProductFilters } from '@/lib/useProductFilters'
import type { Product } from '@/lib/types'

export function CategoryPage({ products = [] }: { products?: Product[] }) {
  const params = useParams<{ slug?: string | string[] }>()
  // Catch-all route: /product-category/men/sneakers -> take the leaf segment.
  const slug = Array.isArray(params.slug) ? params.slug[params.slug.length - 1] : params.slug

  const { filters, setFilters, clear, facets, results, activeCount } = useProductFilters(products)

  const categoryName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'All Products'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Category banner */}
      <div className="relative overflow-hidden" style={{ height: 280, background: '#111' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1440&h=280&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
          <nav className="flex gap-2 text-xs mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <span>/</span>
            <span className="text-white">{categoryName}</span>
          </nav>
          <h1
            className="text-4xl md:text-6xl font-black uppercase text-white"
            style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
          >
            {categoryName}
          </h1>
          {/* Real count — this line previously claimed a fixed 142 products. */}
          <p className="mt-2 text-sm text-white/60">
            Premium footwear, real brands, Indian prices ·{' '}
            <strong className="text-white">
              {products.length} product{products.length === 1 ? '' : 's'}
            </strong>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong>
            {results.length === products.length ? ' products' : ` of ${products.length}`}
          </p>
          <div className="flex items-center gap-3">
            <FilterDrawer
              filters={filters}
              facets={facets}
              onChange={setFilters}
              onClear={clear}
              resultCount={results.length}
              showCategories={false}
            />
            <SortSelect value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[248px_minmax(0,1fr)] gap-10">
          <aside className="hidden lg:block">
            <div className="sticky" style={{ top: 96 }}>
              {/* The route already scopes this page to one category. */}
              <FilterPanel filters={filters} facets={facets} onChange={setFilters} showCategories={false} />
            </div>
          </aside>

          <div className="min-w-0">
            <ActiveChips filters={filters} onChange={setFilters} onClear={clear} />

            {results.length === 0 ? (
              <div className="text-center py-20">
                <SearchX size={30} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
                <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {products.length === 0 ? 'Nothing here yet' : 'Nothing matches those filters'}
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  {products.length === 0
                    ? 'This category has no products at the moment.'
                    : `${activeCount} filter${activeCount === 1 ? '' : 's'} applied. Try removing one.`}
                </p>
                {products.length === 0 ? (
                  <Link
                    href="/shop"
                    className="inline-block px-7 py-3 text-xs font-black uppercase tracking-widest text-white"
                    style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit), Outfit' }}
                  >
                    Browse everything
                  </Link>
                ) : (
                  <button
                    onClick={clear}
                    className="px-7 py-3 text-xs font-black uppercase tracking-widest text-white"
                    style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit), Outfit' }}
                  >
                    Clear all filters
                  </button>
                )}
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
      </div>
    </div>
  )
}

export default CategoryPage
