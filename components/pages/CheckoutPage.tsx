'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, Wallet, CreditCard, Banknote } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { fetchAddresses } from '@/lib/api'
import { Tag, X } from 'lucide-react'

import { SITE } from '@/data/site'
import { DEFAULT_SETTINGS, shippingFor, type StoreSettings } from '@/lib/settings'
import type { Address, PaymentMode } from '@/lib/types'

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

export function CheckoutPage({ settings = DEFAULT_SETTINGS }: { settings?: StoreSettings }) {
  const { lines, clear } = useCart()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressId, setAddressId] = useState<string | null>(null)
  const [mode, setMode] = useState<PaymentMode>('PREPAID')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  // Server-priced totals. The UI never computes money it might get wrong.
  const [quote, setQuote] = useState<{ total: number; shippingFee: number } | null>(null)

  const cartPayload = lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty }))

  // Re-price whenever the basket, mode or coupon changes.
  useEffect(() => {
    if (!lines.length) return
    let alive = true
    fetch('/api/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: cartPayload, mode, couponCode: applied?.code ?? null }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (typeof d.total === 'number') setQuote({ total: d.total, shippingFee: d.shippingFee })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, mode, applied])

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponBusy(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: cartPayload, mode, couponCode: coupon.trim() }),
      })
      const d = await res.json()
      if (d.valid) {
        setApplied({ code: d.code, discount: d.couponDiscount })
        setCouponMsg(null)
        setCoupon('')
      } else {
        setCouponMsg(d.error ?? 'That coupon is not valid.')
      }
    } finally {
      setCouponBusy(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    fetchAddresses(user.id)
      .then((a) => {
        setAddresses(a)
        setAddressId(a.find((x) => x.is_default)?.id ?? a[0]?.id ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load addresses.'))
      .finally(() => setLoading(false))
  }, [user])

  const address = addresses.find((a) => a.id === addressId)
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  // Display-only estimates so the option cards show a number before the server
  // replies. The authoritative figure is `quote`, and the charge is server-side.
  const couponOff = applied?.discount ?? 0
  const ship = shippingFor(subtotal, settings)
  const prepaidEstimate = Math.round((subtotal - couponOff) * (1 - SITE.prepaidDiscountPct / 100)) + ship
  const codEstimate = subtotal - couponOff + ship + SITE.codFee
  const total = quote?.total ?? (mode === 'PREPAID' ? prepaidEstimate : mode === 'COD' ? codEstimate : subtotal - couponOff + ship)
  const payNow = mode === 'PREPAID' ? total : mode === 'PARTIAL_COD' ? Math.min(SITE.partialCodAdvance, total) : 0
  const dueLater = total - payNow

  const submit = async () => {
    if (!user || !address) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: cartPayload,
          mode,
          couponCode: applied?.code ?? null,
          addressId,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Could not place the order.')
        setBusy(false)
        return
      }

      // With Cashfree live, hand off to their SDK. Until credentials exist the
      // order is created unpaid and the webhook confirms it later.
      if (d.paymentSessionId) {
        const { load } = await import('@cashfreepayments/cashfree-js')
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        })
        clear()
        await cashfree.checkout({
          paymentSessionId: d.paymentSessionId,
          redirectTarget: '_self',
        })
        return
      }

      // Navigate first: clearing the cart re-renders the empty state and can
      // strand the redirect mid-flight.
      setPlaced(true)
      router.replace(`/checkout/success?order=${d.orderNumber}`)
      clear()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place the order.')
      setBusy(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center" style={{ background: 'var(--bg)', minHeight: '60vh' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (!lines.length && !placed) {
    return (
      <div style={{ background: 'var(--bg)' }}>
        <PageHero eyebrow="Checkout" title="Nothing to pay for" crumbs={[{ label: 'Checkout' }]} compact />
        <div className="mx-auto max-w-[1440px] px-6 pb-24">
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
          >
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  const MODES: { key: PaymentMode; label: string; sub: string; icon: typeof Wallet; amount: number }[] = [
    {
      key: 'PREPAID',
      label: 'Pay online',
      sub: `${SITE.prepaidDiscountPct}% off · UPI, cards, net banking`,
      icon: CreditCard,
      amount: prepaidEstimate,
    },
    {
      key: 'PARTIAL_COD',
      label: `Pay ₹${SITE.partialCodAdvance} now, rest on delivery`,
      sub: 'Advance covers shipping · non-refundable if refused',
      icon: Wallet,
      amount: SITE.partialCodAdvance,
    },
    {
      key: 'COD',
      label: 'Cash on delivery',
      sub: `₹${SITE.codFee} handling fee`,
      icon: Banknote,
      amount: codEstimate,
    },
  ]

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero eyebrow="Almost yours" title="Checkout" crumbs={[{ label: 'Checkout' }]} compact />

      <section className="mx-auto max-w-[1440px] px-6 pb-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
          <div className="space-y-4">
            {error && (
              <p className="text-xs px-4 py-3" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', borderRadius: 10 }}>
                {error}
              </p>
            )}

            {/* Address */}
            <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
                Deliver to
              </p>
              {addresses.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No saved address.{' '}
                  <Link href="/my-account" style={{ color: 'var(--accent)', fontWeight: 700 }}>Add one</Link> to continue.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses.map((a) => {
                    const on = a.id === addressId
                    return (
                      <button
                        key={a.id}
                        onClick={() => setAddressId(a.id)}
                        className="text-left p-4"
                        style={{
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 14,
                          background: on ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'transparent',
                        }}
                      >
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {a.line1}<br />{a.city}, {a.state} {a.pincode}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{a.phone}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
                Payment method
              </p>
              <div className="space-y-3">
                {MODES.map(({ key, label, sub, icon: Icon, amount }) => {
                  const on = mode === key
                  return (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                      style={{
                        border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14,
                        background: on ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'transparent',
                      }}
                    >
                      <Icon size={18} style={{ color: on ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                      </div>
                      <span className="text-sm font-black shrink-0" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
                        {inr(amount)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
                Summary
              </p>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={inr(subtotal)} />
                {applied && <Row label={`Coupon ${applied.code}`} value={`− ${inr(applied.discount)}`} tint="var(--success)" />}
                {mode === 'PREPAID' && <Row label={`Prepaid discount (${SITE.prepaidDiscountPct}%)`} value="applied" tint="var(--success)" />}
                <Row label="Shipping" value={(quote?.shippingFee ?? ship) === 0 ? 'FREE' : inr(quote?.shippingFee ?? ship)} tint={(quote?.shippingFee ?? ship) === 0 ? 'var(--success)' : undefined} />
                {mode === 'COD' && <Row label="COD fee" value={inr(SITE.codFee)} />}
              </div>

              {/* Coupon */}
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                {applied ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5"
                       style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)', borderRadius: 10 }}>
                    <span className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--success)' }}>
                      <Tag size={13} /> {applied.code} applied
                    </span>
                    <button onClick={() => setApplied(null)} aria-label="Remove coupon" style={{ color: 'var(--success)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="flex-1 px-3.5 text-sm outline-none"
                        style={{ height: 44, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponBusy || !coupon.trim()}
                        className="px-5 text-[11px] font-black uppercase tracking-widest"
                        style={{ border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 10, opacity: couponBusy || !coupon.trim() ? 0.5 : 1 }}>
                        {couponBusy ? '…' : 'Apply'}
                      </button>
                    </div>
                    {couponMsg && <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>{couponMsg}</p>}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {inr(total)}
                </span>
              </div>

              {dueLater > 0 && payNow > 0 && (
                <p className="mt-4 text-xs font-bold px-3.5 py-2.5" style={{ background: 'color-mix(in srgb, var(--warning) 14%, transparent)', color: 'var(--warning)', borderRadius: 10 }}>
                  Pay {inr(payNow)} now · {inr(dueLater)} on delivery
                </p>
              )}

              <button
                onClick={submit}
                disabled={busy || !address}
                className="w-full flex items-center justify-center gap-2 mt-6 py-4 text-[11px] font-black uppercase tracking-widest text-white"
                style={{
                  background: 'var(--accent)',
                  borderRadius: 99,
                  fontFamily: 'var(--font-outfit)',
                  opacity: busy || !address ? 0.5 : 1,
                  cursor: busy || !address ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? <><Loader2 size={15} className="animate-spin" /> Placing order</> : `Place order · ${inr(payNow || total)}`}
              </button>

              <p className="flex items-start gap-2 text-[11px] mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <ShieldCheck size={13} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                Payment is confirmed by Cashfree before we dispatch. Nothing is charged here yet.
              </p>
            </div>
          </aside>
        </div>
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

export default CheckoutPage
