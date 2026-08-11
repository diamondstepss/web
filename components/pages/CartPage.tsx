'use client'

import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowRight, Truck, Minus, Plus, ShieldCheck } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { useCart } from '@/context/CartContext'
import { useConfirm } from '@/components/ConfirmDialog'
import { SITE } from '@/data/site'
import CrossSell from '@/components/CrossSell'
import type { Product } from '@/lib/types'
import { DEFAULT_SETTINGS, shippingFor, type StoreSettings } from '@/lib/settings'

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

export function CartPage({
  suggestions = [],
  settings = DEFAULT_SETTINGS,
}: {
  suggestions?: Product[]
  /** From the database, so the cart never promises a threshold checkout won't honour. */
  settings?: StoreSettings
}) {
  const { lines, subtotal, savings, setQty, remove } = useCart()
  const confirm = useConfirm()

  const shipping = shippingFor(subtotal, settings)
  const toFreeShipping = Math.max(settings.freeShippingOver - subtotal, 0)
  const total = subtotal + shipping

  if (!lines.length) {
    return (
      <div style={{ background: 'var(--bg)' }}>
        <PageHero eyebrow="Your bag" title="Cart" crumbs={[{ label: 'Cart' }]} compact />
        <section className="mx-auto max-w-[1440px] px-6 pb-24">
          <div
            className="text-center py-24 px-6"
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 18 }}
          >
            <ShoppingBag size={46} style={{ color: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.4 }} />
            <h2
              className="text-2xl font-black uppercase mb-3"
              style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Your cart is empty
            </h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              Free shipping over ₹{settings.freeShippingOver.toLocaleString('en-IN')} and {SITE.returnWindowDays}-day easy returns on everything.
            </p>
            <Link
              href="/shop"
              className="inline-block px-9 py-3.5 text-[11px] font-black uppercase tracking-widest text-white"
              style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
            >
              Start shopping
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Your bag"
        title={`Cart (${lines.length})`}
        crumbs={[{ label: 'Cart' }]}
        compact
      />

      <section className="mx-auto max-w-[1440px] px-6 pb-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
          {/* Lines */}
          <div className="space-y-4">
            {toFreeShipping > 0 && (
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}
              >
                <Truck size={17} style={{ color: 'var(--accent)' }} />
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Add {inr(toFreeShipping)} more for free shipping
                  </p>
                  <div className="mt-2" style={{ height: 5, background: 'var(--hover)', borderRadius: 99 }}>
                    <div
                      style={{
                        width: `${Math.min((subtotal / settings.freeShippingOver) * 100, 100)}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        borderRadius: 99,
                        transition: 'width .3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {lines.map((l) => (
              <article
                key={`${l.productId}-${l.size ?? 'one'}`}
                className="flex gap-5 p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}
              >
                <Link
                  href={`/product/${l.productId}`}
                  className="shrink-0 overflow-hidden"
                  style={{ width: 104, height: 104, borderRadius: 12, background: 'var(--hover)' }}
                >
                  {l.image && <img src={l.image} alt={l.title} className="w-full h-full object-cover" />}
                </Link>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                  >
                    {l.brand}
                  </p>
                  <Link href={`/product/${l.productId}`}>
                    <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {l.title}
                    </p>
                  </Link>
                  {l.size && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Size UK {l.size}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <div
                      className="flex items-center"
                      style={{ border: '1px solid var(--border)', borderRadius: 99 }}
                    >
                      <button
                        onClick={() => setQty(l.productId, l.size, l.qty - 1)}
                        aria-label="Decrease quantity"
                        className="px-3 py-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span
                        className="px-2 text-sm font-bold min-w-[26px] text-center"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {l.qty}
                      </span>
                      <button
                        onClick={() => setQty(l.productId, l.size, l.qty + 1)}
                        aria-label="Increase quantity"
                        className="px-3 py-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Remove from cart?',
                          message: `"${l.title}" will be removed from your bag.`,
                          confirmLabel: 'Remove',
                        })
                        if (ok) remove(l.productId, l.size)
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className="text-lg font-black"
                    style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}
                  >
                    {inr(l.price * l.qty)}
                  </p>
                  {l.mrp > l.price && (
                    <p className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                      {inr(l.mrp * l.qty)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
              <p
                className="text-[11px] font-black uppercase tracking-[0.18em] mb-5"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
              >
                Order summary
              </p>

              <div className="space-y-3 text-sm">
                <Row label={`Subtotal (${lines.length} item${lines.length === 1 ? '' : 's'})`} value={inr(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? 'FREE' : inr(shipping)} tint={shipping === 0 ? 'var(--success)' : undefined} />
                {savings > 0 && <Row label="You save" value={`− ${inr(savings)}`} tint="var(--success)" />}
              </div>

              <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span
                  className="text-2xl font-black"
                  style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {inr(total)}
                </span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Inclusive of all taxes</p>

              <Link
                href="/checkout"
                className="group flex items-center justify-center gap-2 w-full mt-6 py-4 text-[11px] font-black uppercase tracking-widest text-white"
                style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
              >
                Checkout
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <p className="flex items-center justify-center gap-1.5 text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>
                <ShieldCheck size={13} style={{ color: 'var(--success)' }} /> Secure checkout{settings.codEnabled ? ' · COD available' : ''}
              </p>
            </div>
          </aside>
        </div>

        <CrossSell
          products={suggestions}
          title="Complete the look"
          subtitle="One-size items — add without leaving your bag."
        />
      </section>
    </div>
  )
}

function Row({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-bold" style={{ color: tint ?? 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default CartPage
