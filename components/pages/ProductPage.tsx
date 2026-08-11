'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/settings'
import {
  Heart,
  Shield,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  Truck,
  Banknote,
  RotateCcw,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'

import type { Product } from '@/lib/types'
import type { MediaSlide } from '@/lib/catalog'
import { useCart } from '@/context/CartContext'
import SizeGuideModal from '@/components/SizeGuideModal'



function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-sm font-bold uppercase tracking-wider text-left"
        style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}
      >
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function ProductPage({
  product: incoming,
  related = [],
  gallery = [],
  settings = DEFAULT_SETTINGS,
}: { product?: Product; related?: Product[]; gallery?: MediaSlide[]; settings?: StoreSettings } = {}) {
  const PRODUCTS = related
  // Gallery from the database; fall back to the product's main image.
  const THUMBNAILS: MediaSlide[] =
    gallery.length > 0
      ? gallery
      : incoming?.image
        ? [{ type: 'IMAGE', url: incoming.image, poster: null }]
        : []
  const { add } = useCart()
  // Footwear must have a size chosen; accessories have none to choose.
  const needsSize = Boolean(incoming?.sizes?.length)
  const [activeThumb, setActiveThumb] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  // Sizes come from the product. They were previously a hardcoded 6–11 with
  // size 11 always marked sold out, on every product in the catalog.
  const sizes: number[] = incoming?.sizes?.length ? incoming.sizes : []
  const outOfStock = typeof incoming?.stock === 'number' && incoming.stock <= 0

  // Per-size availability, when it's known. A product fetched before the
  // size-stock migration ran (or an accessory, which has none) has no
  // `sizeStock` at all — falls back to the product-wide flag rather than
  // treating "we don't know" as "sold out everywhere."
  const sizeStockOf = (s: number) => incoming?.sizeStock?.[s]
  const sizeSoldOut = (s: number) => {
    const n = sizeStockOf(s)
    return n !== undefined ? n <= 0 : outOfStock
  }

  const [qty, setQty] = useState(1)
  // Caps the stepper once there's an actual number to cap it to. Left
  // uncapped when unknown, same as before this feature existed — checkout
  // still refuses an order for more than is really on hand either way.
  const knownStock = needsSize
    ? selectedSize !== null
      ? sizeStockOf(selectedSize)
      : undefined
    : incoming?.stock
  const [payMode, setPayMode] = useState(2) // 0=online,1=cod,2=partial
  const [wishlisted, setWishlisted] = useState(false)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  const isVideo = (t?: MediaSlide) => t?.type === 'YOUTUBE'

  const handleAddToCart = () => {
    // Footwear must have a size picked; accessories have none to pick.
    if (needsSize && selectedSize === null) {
      setSizeError(true)
      return
    }
    if (!incoming) return
    // Belt and braces on top of the disabled "+" button below — the real
    // guard against overselling is the checkout stock check, this just keeps
    // the cart itself from showing a promise the picker already knows is false.
    const cappedQty = knownStock !== undefined ? Math.min(qty, knownStock) : qty
    add(incoming, selectedSize !== null ? String(selectedSize) : null, cappedQty)
    setSizeError(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-6 py-4">
        <nav className="flex gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link
            href={`/product-category/${incoming?.categories?.[0] ?? 'sneakers'}`}
            className="hover:text-white capitalize"
          >
            {(incoming?.categories?.[0] ?? 'shop').replace(/-/g, ' ')}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {incoming?.brand} {incoming?.title}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pb-16">
        {/* Desktop: 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── GALLERY ────────────────────────────────────────────────── */}
          <div className="lg:w-[55%] flex gap-3">
            {/* Thumbnail rail */}
            <div className="hidden lg:flex flex-col gap-2 w-20">
              {THUMBNAILS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveThumb(i); setPlaying(false) }}
                  className="relative w-20 h-20 overflow-hidden shrink-0 border-2 transition-colors duration-200"
                  style={{
                    borderColor: activeThumb === i ? 'var(--accent)' : 'var(--border)',
                    background: '#111',
                  }}
                  aria-label={`Thumbnail ${i + 1}`}
                >
                  <img
                    src={t.type === 'YOUTUBE' ? (t.poster ?? t.url) : t.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {isVideo(t) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ background: 'var(--accent)' }}
                      >
                        <Play size={10} fill="#fff" color="#fff" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="flex-1 relative overflow-hidden group"
              style={{ aspectRatio: '1/1', background: '#111' }}
            >
              {isVideo(THUMBNAILS[activeThumb]) ? (
                // Lite facade: the poster and a play button until you ask for
                // the video, so YouTube's ~1MB player never loads on a page
                // view that was only ever going to look at photos. The button
                // previously had no handler at all, so the video never played.
                playing ? (
                  <iframe
                    src={`${THUMBNAILS[activeThumb]?.url}?autoplay=1&rel=0`}
                    title="Product video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={THUMBNAILS[activeThumb]?.poster ?? ''}
                      alt=""
                      className="w-full h-full object-cover opacity-50 absolute inset-0"
                    />
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      className="relative z-10 w-20 h-20 flex items-center justify-center rounded-full text-white transition-transform hover:scale-105"
                      style={{ background: 'var(--accent)' }}
                      aria-label="Play video"
                    >
                      <Play size={28} fill="#fff" />
                    </button>
                  </div>
                )
              ) : (
                // object-contain, not cover: admin photos come in whatever aspect
                // ratio the phone shot them at. Cropping a tall photo to this
                // square would slice off everything but a thin horizontal band —
                // contain shows the whole photo, letterboxed on the dark backdrop.
                <img
                  src={THUMBNAILS[activeThumb]?.url ?? incoming?.image ?? ''}
                  alt="Product"
                  className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />
              )}

              {/* Mobile swipe dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 lg:hidden">
                {THUMBNAILS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveThumb(i); setPlaying(false) }}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: activeThumb === i ? '#fff' : 'rgba(255,255,255,0.4)',
                      width: activeThumb === i ? 16 : 6,
                    }}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── INFO ─────────────────────────────────────────────────────── */}
          <div className="lg:w-[45%]">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {incoming?.brand}
            </p>
            <h1
              className="text-2xl md:text-3xl font-black uppercase leading-tight mb-3"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {incoming?.title}
            </h1>


            {/* Price */}
            <div className="mb-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                  ₹1,499
                </span>
                <span className="text-lg line-through" style={{ color: 'var(--text-muted)' }}>
                  ₹3,499
                </span>
                <span className="text-base font-black" style={{ color: 'var(--accent)' }}>
                  57% OFF
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Inclusive of all taxes
              </p>
            </div>

            {/* Size selector */}
            <div className="mt-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                  SELECT SIZE
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs font-bold underline"
                  style={{ color: 'var(--accent)' }}
                >
                  SIZE GUIDE
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const soldOut = sizeSoldOut(s)
                  return (
                    <button
                      key={s}
                      disabled={soldOut}
                      onClick={() => {
                        setSelectedSize(s)
                        const n = sizeStockOf(s)
                        if (n !== undefined) setQty((q) => Math.min(Math.max(q, 1), Math.max(n, 1)))
                      }}
                      className="w-12 h-12 text-sm font-bold border-2 transition-all duration-150"
                      style={{
                        borderColor:
                          selectedSize === s
                            ? 'var(--accent)'
                            : 'var(--border)',
                        background:
                          selectedSize === s ? 'var(--accent)' : 'transparent',
                        color: soldOut
                          ? 'var(--text-muted)'
                          : selectedSize === s
                          ? '#fff'
                          : 'var(--text-primary)',
                        opacity: soldOut ? 0.4 : 1,
                        textDecoration: soldOut ? 'line-through' : 'none',
                        borderRadius: 4,
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
              {/* Real stock — the selected size's own count once one is
                  chosen, otherwise the product-wide count for an accessory. */}
              {needsSize
                ? selectedSize !== null &&
                  typeof knownStock === 'number' &&
                  knownStock > 0 &&
                  knownStock <= 5 && (
                    <p className="mt-2 text-xs font-medium" style={{ color: 'var(--warning)' }}>
                      ⚠ Only {knownStock} left in UK {selectedSize}
                    </p>
                  )
                : typeof incoming?.stock === 'number' && incoming.stock > 0 && incoming.stock <= 5 && (
                    <p className="mt-2 text-xs font-medium" style={{ color: 'var(--warning)' }}>
                      ⚠ Only {incoming.stock} left in stock
                    </p>
                  )}
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                QTY
              </span>
              <div
                className="flex items-center border"
                style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-btn)' }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors duration-150"
                  style={{ color: 'var(--text-primary)' }}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {qty}
                </span>
                <button
                  onClick={() =>
                    setQty((q) => (typeof knownStock === 'number' ? Math.min(knownStock, q + 1) : q + 1))
                  }
                  disabled={typeof knownStock === 'number' && qty >= knownStock}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors duration-150"
                  style={{
                    color: 'var(--text-primary)',
                    opacity: typeof knownStock === 'number' && qty >= knownStock ? 0.35 : 1,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {sizeError && (
              <p className="text-xs mb-3 px-4 py-2.5" role="alert"
                 style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', borderRadius: 8 }}>
                Please choose a size first.
              </p>
            )}

            {/* CTAs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ background: added ? 'var(--success)' : 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
              >
                {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
              </button>
              <Link
                href="/checkout"
                className="flex-1 py-3.5 text-sm font-black uppercase tracking-wider text-center border transition-colors duration-200"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-btn)',
                }}
              >
                BUY NOW
              </Link>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="w-12 h-12 flex items-center justify-center border transition-colors duration-200"
                style={{
                  borderColor: wishlisted ? 'var(--accent)' : 'var(--border)',
                  background: wishlisted ? 'rgba(255,51,51,0.1)' : 'transparent',
                  color: wishlisted ? 'var(--accent)' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-btn)',
                }}
                aria-label="Wishlist"
              >
                <Heart size={18} fill={wishlisted ? 'var(--accent)' : 'none'} />
              </button>
            </div>

            {/*
              Delivery terms.

              This was a pincode "checker" that returned a hardcoded
              "Delivery by Tue, 30 Jul" for any six digits — a date already in
              the past, promised for pincodes the shop may not even serve.
              A real check needs Shiprocket's serviceability API; until those
              credentials exist, state only what is actually true.
            */}
            <div
              className="p-4 mb-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                DELIVERY
              </p>
              <ul className="space-y-2">
                {[
                  [Truck, `Free shipping on orders over ₹${settings.freeShippingOver.toLocaleString('en-IN')}`],
                  [Banknote, 'Cash on delivery available across India'],
                  [RotateCcw, '7-day easy returns'],
                ].map(([Icon, label]) => {
                  const I = Icon as typeof Truck
                  return (
                    <li key={String(label)} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <I size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                      {label as string}
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs mt-3 pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Dispatched from Jalandhar. You will get a tracking link by email once it ships.
              </p>
            </div>

            {/* Payment options */}
            <div
              className="p-4 mb-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                PAYMENT OPTIONS
              </p>
              {[
                {
                  label: 'Pay Online',
                  price: '₹1,424',
                  note: 'Extra 5% off',
                  badge: 'RECOMMENDED',
                },
                {
                  label: 'Cash on Delivery',
                  price: '₹1,548',
                  note: '₹49 COD fee',
                },
                {
                  label: 'Pay ₹300 now, ₹1,199 on delivery',
                  price: '₹300 now',
                  note: 'Partial COD',
                },
              ].map((opt, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 py-3 cursor-pointer border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    type="radio"
                    name="paymode"
                    checked={payMode === i}
                    onChange={() => setPayMode(i)}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          className="px-2 py-0.5 text-[10px] font-black uppercase text-white"
                          style={{ background: 'var(--success)', borderRadius: 3 }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {opt.price}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {opt.note}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
              {payMode === 2 && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  ₹300 advance covers shipping and is non-refundable if the order is refused.
                </p>
              )}
            </div>

            {/* Trust row */}
            <div className="flex gap-4 mb-5">
              {[
                { icon: Shield, label: '100% Genuine' },
                { icon: RefreshCw, label: '7-Day Returns' },
                { icon: Lock, label: 'Secure Payments' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <Accordion title="Description" defaultOpen>
                <p>
                  The Nike Air Force 1 Low is one of the most iconic silhouettes in sneaker history. Crafted with
                  premium leather, it delivers classic style, durability, and all-day comfort. Suitable for everyday
                  wear, streetwear, and casual occasions.
                </p>
                <ul className="list-disc list-inside mt-3 space-y-1">
                  <li>Upper: Premium leather</li>
                  <li>Midsole: Nike Air cushioning</li>
                  <li>Outsole: Rubber waffle pattern</li>
                  <li>Colour: White/White</li>
                  <li>Style Code: CW2288-111</li>
                </ul>
              </Accordion>
              <Accordion title="Material & Care">
                <p>
                  Upper: Full-grain leather. Clean with a soft, damp cloth. Do not machine wash. Store in the
                  original box away from direct sunlight.
                </p>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <p>
                  Free shipping on orders over ₹{settings.freeShippingOver.toLocaleString('en-IN')}. Standard delivery 2–5 business days. 7-day easy returns
                  on all unworn, unwashed, tagged items. COD available for all pincodes.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        {/*
          Product reviews are not shown.

          This block previously rendered an invented 4.6 rating, "128 reviews"
          and three written reviews — identical on every product in the catalog,
          for products that have never been reviewed. Real per-product reviews
          need a reviews table fed by verified purchases; until then, showing
          nothing is the honest option.

          The shop's genuine Google reviews are on the homepage.
        */}

        {/* ── YOU MAY ALSO LIKE ─────────────────────────────────────────── */}
        <div className="mt-16">
          <h2
            className="text-2xl font-black uppercase tracking-tight mb-8"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            YOU MAY ALSO LIKE
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {PRODUCTS.slice(1, 7).map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center justify-between px-4 py-3 border-t z-30"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-lg font-black" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
            ₹1,499
          </p>
          <p className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
            ₹3,499
          </p>
        </div>
        <button
          onClick={() => setSizeSheetOpen(true)}
          className="px-8 py-3.5 text-sm font-black uppercase tracking-wider text-white"
          style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
        >
          ADD TO CART
        </button>
      </div>

      {/* Size bottom sheet (mobile) */}
      {sizeSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            className="flex-1"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSizeSheetOpen(false)}
          />
          <div
            className="slide-up p-5"
            style={{ background: 'var(--surface)', borderRadius: '12px 12px 0 0' }}
          >
            <h3 className="font-black text-base uppercase mb-4" style={{ fontFamily: 'Outfit' }}>
              SELECT SIZE (UK)
            </h3>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {sizes.map((s) => {
                const soldOut = sizeSoldOut(s)
                return (
                  <button
                    key={s}
                    disabled={soldOut}
                    onClick={() => {
                      setSelectedSize(s)
                      const n = sizeStockOf(s)
                      if (n !== undefined) setQty((q) => Math.min(Math.max(q, 1), Math.max(n, 1)))
                    }}
                    className="h-12 text-sm font-bold border-2 transition-all duration-150"
                    style={{
                      borderColor: selectedSize === s ? 'var(--accent)' : 'var(--border)',
                      background: selectedSize === s ? 'var(--accent)' : 'transparent',
                      color: soldOut ? 'var(--text-muted)' : selectedSize === s ? '#fff' : 'var(--text-primary)',
                      opacity: soldOut ? 0.4 : 1,
                      textDecoration: soldOut ? 'line-through' : 'none',
                      borderRadius: 4,
                    }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { handleAddToCart(); setSizeSheetOpen(false) }}
              className="w-full py-3.5 text-sm font-black uppercase tracking-wider text-white mb-8"
              style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      )}

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        availableSizes={sizes}
      />
    </div>
  )
}


export default ProductPage
