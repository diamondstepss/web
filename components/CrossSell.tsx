'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Check, ImageOff } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/lib/types'

/**
 * "Add these too" on the cart page.
 *
 * Placed on the cart rather than inside checkout on purpose: once someone is
 * entering an address and choosing how to pay, an upsell competes with the
 * thing you actually want them to finish. The cart is the last point where
 * browsing is still the mode they're in.
 *
 * One tap adds. These are one-size items with no variant to choose, so a size
 * step would be friction for nothing — and anything that does need a size
 * links out to its product page instead of pretending it can be added blind.
 */

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

export default function CrossSell({
  products,
  title = 'Add these too',
  subtitle,
}: {
  products: Product[]
  title?: string
  subtitle?: string
}) {
  const { lines, add } = useCart()
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const inCart = new Set(lines.map((l) => l.productId))

  const candidates = products
    // Keep a just-added item on screen so its "Added" state is actually seen —
    // filtering it out immediately made the card vanish on tap, leaving no
    // confirmation that anything had happened.
    .filter((p) => !inCart.has(p.id) || p.id === justAdded)
    // Never suggest something that can't be bought.
    .filter((p) => p.badge !== 'SOLD OUT' && (typeof p.stock !== 'number' || p.stock > 0))
    // Cheapest first: an add-on is an easier yes at a lower price.
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)

  if (!candidates.length) return null

  const handleAdd = (p: Product) => {
    // Items with sizes can't be added blind — the card links out instead.
    if (p.sizes?.length) return
    add(p, null, 1)
    setJustAdded(p.id)
    setTimeout(() => setJustAdded((cur) => (cur === p.id ? null : cur)), 2000)
  }

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2
          className="text-lg font-black uppercase tracking-tight"
          style={{ fontFamily: 'var(--font-outfit), Outfit', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {candidates.map((p) => {
          const needsSize = Boolean(p.sizes?.length)
          const added = justAdded === p.id
          return (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}
            >
              <Link href={`/product/${p.id}`} className="block" style={{ aspectRatio: '1/1', background: 'var(--hover)' }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={`${p.brand} ${p.title}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center">
                    <ImageOff size={18} style={{ color: 'var(--text-muted)' }} />
                  </span>
                )}
              </Link>

              <div className="p-3 flex flex-col flex-1">
                <Link href={`/product/${p.id}`} className="block">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    {p.brand}
                  </p>
                  <p
                    className="text-[13px] font-bold leading-snug mt-0.5 line-clamp-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {p.title}
                  </p>
                </Link>

                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                    {inr(p.price)}
                  </span>
                  {p.mrp > p.price && (
                    <span className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>
                      {inr(p.mrp)}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {inCart.has(p.id) && !needsSize ? (
                    <Link
                      href="/cart"
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-widest"
                      style={{
                        background: 'var(--success)',
                        color: '#fff',
                        borderRadius: 99,
                        fontFamily: 'var(--font-outfit), Outfit',
                      }}
                    >
                      <Check size={13} /> In your bag
                    </Link>
                  ) : needsSize ? (
                    // Honest: a size has to be chosen, so send them to the page
                    // rather than adding an arbitrary one.
                    <Link
                      href={`/product/${p.id}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-widest"
                      style={{
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: 99,
                        fontFamily: 'var(--font-outfit), Outfit',
                      }}
                    >
                      Choose size
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(p)}
                      aria-label={`Add ${p.brand} ${p.title} to your bag`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-widest transition-colors"
                      style={{
                        background: added ? 'var(--success)' : 'var(--accent)',
                        color: '#fff',
                        borderRadius: 99,
                        fontFamily: 'var(--font-outfit), Outfit',
                      }}
                    >
                      {added ? (
                        <>
                          <Check size={13} /> Added
                        </>
                      ) : (
                        <>
                          <Plus size={13} /> Add
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
