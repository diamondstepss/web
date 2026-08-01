'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronDown, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/types'

const BRANDS = [
  'Nike', 'Adidas', 'Jordan', 'Puma', 'Converse', 'Vans',
  'Crocs', 'ASICS', 'New Balance', 'Onitsuka Tiger', 'Amiri', 'Balenciaga', 'BAPE', 'Louis Vuitton',
]
const SIZES = [6, 7, 8, 9, 10, 11]
const DISCOUNTS = [
  { label: '10% and above', value: 10 },
  { label: '20% and above', value: 20 },
  { label: '40% and above', value: 40 },
  { label: '60% and above', value: 60 },
]

export function CategoryPage({ products = [] }: { products?: Product[] }) {
  const PRODUCTS = products
  const params = useParams<{ slug?: string | string[] }>()
  // Catch-all route: /product-category/men/sneakers -> take the leaf segment.
  const slug = Array.isArray(params.slug) ? params.slug[params.slug.length - 1] : params.slug
  const searchParams = useSearchParams()
  const brandParam = searchParams.get('brand')

  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : [])
  const [priceRange, setPriceRange] = useState([799, 3500])
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null)
  const [sort, setSort] = useState('Featured')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)

  const categoryName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'All Products'

  const toggleSize = (s: number) =>
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))

  const activeFilters: Array<{ label: string; onRemove: () => void }> = [
    ...selectedSizes.map((s) => ({
      label: `UK ${s}`,
      onRemove: () => setSelectedSizes((p) => p.filter((x) => x !== s)),
    })),
    ...selectedBrands.map((b) => ({
      label: b,
      onRemove: () => setSelectedBrands((p) => p.filter((x) => x !== b)),
    })),
  ]
  if (selectedDiscount !== null) {
    activeFilters.push({
      label: `${selectedDiscount}%+`,
      onRemove: () => setSelectedDiscount(null),
    })
  }

  const clearAll = () => {
    setSelectedSizes([])
    setSelectedBrands([])
    setSelectedDiscount(null)
    setPriceRange([799, 3500])
  }

  const sortOptions = ['Featured', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Discount']

  const SIDEBAR = (
    <div
      className="space-y-6"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* Size */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
          Size (UK)
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className="w-10 h-10 text-sm font-medium border transition-colors duration-200"
              style={{
                background: selectedSizes.includes(s) ? 'var(--accent)' : 'transparent',
                borderColor: selectedSizes.includes(s) ? 'var(--accent)' : 'var(--border)',
                color: selectedSizes.includes(s) ? '#fff' : 'var(--text-primary)',
                borderRadius: 4,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
          Brand
        </h3>
        <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
          {BRANDS.map((b) => (
            <label key={b} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b)}
                onChange={() => toggleBrand(b)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="text-sm">{b}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
          Price
        </h3>
        <div className="flex items-center justify-between text-sm mb-3">
          <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
          <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={799}
          max={3500}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full"
        />
      </div>

      {/* Discount */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
          Discount
        </h3>
        <div className="space-y-2">
          {DISCOUNTS.map((d) => (
            <label key={d.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={selectedDiscount === d.value}
                onChange={() => setSelectedDiscount(d.value)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="text-sm">{d.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Category banner */}
      <div className="relative overflow-hidden" style={{ height: 280, background: '#111' }}>
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1440&h=280&fit=crop&auto=format"
          alt={categoryName}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
          {/* Breadcrumb */}
          <nav className="flex gap-2 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/product-category/sneakers" className="hover:text-white">Shop</Link>
            <span>/</span>
            <span className="text-white">{categoryName}</span>
          </nav>
          <h1
            className="text-4xl md:text-6xl font-black uppercase text-white"
            style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
          >
            {categoryName}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Premium footwear, real brands, Indian prices · <strong className="text-white">142 products</strong>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        {/* Active filters + sort bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {f.label}
                <button onClick={f.onRemove} aria-label={`Remove ${f.label}`}>
                  <X size={10} />
                </button>
              </span>
            ))}
            {activeFilters.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold underline"
                style={{ color: 'var(--accent)' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm border transition-colors duration-200"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-btn)',
                background: 'var(--surface)',
              }}
            >
              {sort}
              <ChevronDown size={14} />
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 z-20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {sortOptions.map((o) => (
                  <button
                    key={o}
                    onClick={() => { setSort(o); setSortOpen(false) }}
                    className="block w-full text-left px-4 py-2.5 text-sm transition-colors duration-150"
                    style={{
                      color: sort === o ? 'var(--accent)' : 'var(--text-primary)',
                      background: sort === o ? 'var(--surface-hover)' : 'transparent',
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <aside
            className="w-64 shrink-0 sticky top-24 self-start hidden md:block"
            style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
          >
            {SIDEBAR}
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {PRODUCTS.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {/* Skeleton loaders */}
              {[1, 2, 3, 4].map((i) => (
                <div key={`sk-${i}`} className="skeleton" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-9 h-9 text-sm font-medium border transition-colors duration-200"
                  style={{
                    borderColor: page === p ? 'var(--accent)' : 'var(--border)',
                    background: page === p ? 'var(--accent)' : 'transparent',
                    color: page === p ? '#fff' : 'var(--text-primary)',
                    borderRadius: 4,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter/sort bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex md:hidden z-30 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => setFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest border-r"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          <SlidersHorizontal size={16} /> FILTER
        </button>
        <button
          onClick={() => setSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-primary)' }}
        >
          <ArrowUpDown size={16} /> SORT
        </button>
      </div>

      {/* Filter bottom sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setFilterOpen(false)} />
          <div
            className="slide-up overflow-y-auto"
            style={{ background: 'var(--surface)', borderRadius: '12px 12px 0 0', maxHeight: '80vh' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-base" style={{ fontFamily: 'Outfit' }}>FILTER</h3>
              <button onClick={() => setFilterOpen(false)}><X size={18} /></button>
            </div>
            <div className="px-5 py-4">{SIDEBAR}</div>
            <div className="px-5 pb-8">
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full py-3 text-sm font-bold uppercase tracking-widest text-white"
                style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort bottom sheet */}
      {sortOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSortOpen(false)} />
          <div
            className="slide-up"
            style={{ background: 'var(--surface)', borderRadius: '12px 12px 0 0' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-base" style={{ fontFamily: 'Outfit' }}>SORT BY</h3>
              <button onClick={() => setSortOpen(false)}><X size={18} /></button>
            </div>
            {sortOptions.map((o) => (
              <button
                key={o}
                onClick={() => { setSort(o); setSortOpen(false) }}
                className="w-full text-left px-5 py-4 text-sm border-b transition-colors duration-150"
                style={{
                  borderColor: 'var(--border)',
                  color: sort === o ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: sort === o ? 700 : 400,
                }}
              >
                {o}
              </button>
            ))}
            <div className="h-8" />
          </div>
        </div>
      )}
    </div>
  )
}


export default CategoryPage
