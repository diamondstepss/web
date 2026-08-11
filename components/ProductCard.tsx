'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import { Heart } from 'lucide-react'
import Link from 'next/link'

interface ProductCardProps {
  product: Product
  compact?: boolean
}

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function ProductCard({ product, compact }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false)
  const [hoveredSize, setHoveredSize] = useState<number | null>(null)

  const sizes = product.sizes ?? [6, 7, 8, 9, 10, 11]

  return (
    <Link
      href={`/product/${product.id}`}
      className="product-card block relative group"
      style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}
    >
      {/* Image */}
      <div
        className="product-image relative overflow-hidden"
        style={{ aspectRatio: '1/1', background: '#111' }}
      >
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span
              className="px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider"
              style={{ background: '#111' }}
            >
              NEW
            </span>
          )}
          {product.discount >= 10 && !product.badge && (
            <span
              className="px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider"
              style={{ background: 'var(--accent)' }}
            >
              -{product.discount}%
            </span>
          )}
          {product.badge === 'SOLD OUT' && (
            <span
              className="px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider"
              style={{ background: '#444' }}
            >
              SOLD OUT
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setWishlisted(!wishlisted)
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            background: wishlisted ? 'var(--accent)' : 'rgba(255,255,255,0.9)',
            color: wishlisted ? '#fff' : '#111',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
          aria-label="Wishlist"
        >
          <Heart size={14} fill={wishlisted ? '#fff' : 'none'} />
        </button>

        {/* Size chips on hover (desktop) */}
        {!compact && (
          <div
            className="absolute bottom-0 left-0 right-0 px-2 pb-2 hidden md:flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {sizes.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors duration-150"
                style={{
                  background: hoveredSize === s ? 'var(--accent)' : 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  borderRadius: 4,
                }}
                onMouseEnter={() => setHoveredSize(s)}
                onMouseLeave={() => setHoveredSize(null)}
              >
                UK {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {product.brand}
        </p>
        <p
          className="text-sm font-medium leading-snug mb-2 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {product.title}
        </p>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(product.price)}
          </span>
          {product.mrp > product.price && (
            <span
              className="text-xs line-through"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatPrice(product.mrp)}
            </span>
          )}
          {product.discount > 0 && (
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {product.discount}% off
            </span>
          )}
        </div>

        {/* Size chips (mobile — always visible) */}
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-2 md:hidden">
            {sizes.map((s) => (
              <span
                key={s}
                className="px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text-muted)',
                  borderRadius: 3,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
