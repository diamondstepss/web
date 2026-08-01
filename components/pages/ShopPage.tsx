'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import PageHero from '@/components/PageHero'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/types'

const CATEGORIES = [
  { label: 'All', slug: 'all' },
  { label: 'Sneakers', slug: 'sneakers' },
  { label: 'Sports Shoes', slug: 'sports' },
  { label: 'Running Shoes', slug: 'running' },
  { label: 'Loafers', slug: 'loafers' },
  { label: 'Chelsea Boots', slug: 'chelsea-boots' },
  { label: 'Leather Shoes', slug: 'leather' },
  { label: 'Slippers', slug: 'slippers' },
  { label: 'Accessories', slug: 'accessories' },
]

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'new', label: 'Newest' },
  { key: 'low', label: 'Price: low to high' },
  { key: 'high', label: 'Price: high to low' },
  { key: 'discount', label: 'Biggest discount' },
] as const

export function ShopPage({ products: incoming = [] }: { products?: Product[] }) {
  const PRODUCTS = incoming
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('featured')

  const products = useMemo(() => {
    const list = [...PRODUCTS]
    switch (sort) {
      case 'low':
        return list.sort((a, b) => a.price - b.price)
      case 'high':
        return list.sort((a, b) => b.price - a.price)
      case 'discount':
        return list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
      case 'new':
        return list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false))
      default:
        return list
    }
  }, [sort])

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Everything in stock"
        title="Shop All"
        lede="Fourteen brands, UK 6 to 11, ₹799 to ₹3,500. Free shipping over ₹999."
        crumbs={[{ label: 'Shop' }]}
        image="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1440&h=460&fit=crop&auto=format"
        compact
      />

      {/* Category rail */}
      <div
        className="sticky z-30"
        style={{ top: 61, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex items-center gap-6 justify-between">
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-3">
              {CATEGORIES.map((c) => {
                const active = cat === c.slug
                return (
                  <button
                    key={c.slug}
                    onClick={() => setCat(c.slug)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-200"
                    style={{
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'Outfit',
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="text-xs font-bold uppercase tracking-widest outline-none py-2"
                style={{ background: 'transparent', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key} style={{ background: 'var(--surface)' }}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{products.length}</strong> products
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

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
      </section>
    </div>
  )
}


export default ShopPage
