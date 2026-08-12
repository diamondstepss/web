'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

// Pages where a "go to cart" bar over the content is either redundant (the
// cart/checkout itself) or would sit over content it shouldn't.
const HIDDEN_PREFIXES = ['/cart', '/checkout']

/**
 * Floating sticky bar so the cart the header badge already tracks doesn't
 * disappear the moment you scroll past it — same problem most cart-badge-only
 * storefronts have, that a full cart mid-browse is easy to forget about.
 */
export default function CartBar() {
  const { lines, count, subtotal, hydrated } = useCart()
  const pathname = usePathname()

  if (!hydrated || count === 0) return null
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null

  const previews = lines.slice(0, 3)
  const extra = lines.length - previews.length

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Link
        href="/cart"
        className="mx-auto flex items-center gap-3 px-4 py-3 sm:max-w-[560px] sm:mb-4 sm:rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, var(--accent-dark), var(--accent))',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12)',
        }}
        aria-label={`View cart — ${count} item${count === 1 ? '' : 's'}, ${inr(subtotal)}`}
      >
        {/* Stacked previews of what's actually in the cart, not just a count. */}
        <div className="flex items-center shrink-0" style={{ marginLeft: 4 }}>
          {previews.map((l, i) => (
            <div
              key={`${l.productId}-${l.size ?? ''}`}
              className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
              style={{
                marginLeft: i === 0 ? 0 : -10,
                border: '2px solid var(--accent)',
                background: '#fff',
                zIndex: previews.length - i,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {extra > 0 && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-black text-white"
              style={{ marginLeft: -10, border: '2px solid var(--accent)', background: 'var(--accent-dark)', zIndex: 0 }}
            >
              +{extra}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-bold leading-tight">
            {count} item{count === 1 ? '' : 's'} in cart
          </p>
          <p className="text-white text-[15px] font-black leading-tight mt-0.5" style={{ fontFamily: 'var(--font-outfit)' }}>
            {inr(subtotal)}
          </p>
        </div>

        <span
          className="flex items-center gap-1 shrink-0 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider"
          style={{ background: '#fff', color: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
        >
          View cart
          <ChevronRight size={14} />
        </span>
      </Link>
    </div>
  )
}
