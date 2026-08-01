'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Shield,
  Truck,
  RefreshCw,
  CreditCard,
  Star,
  CheckCircle,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/types'
import type { DbCategory } from '@/lib/catalog'

/** SALE_PRODUCTS is a subset of PRODUCTS — merging them needs a dedupe. */
const uniqueById = <T extends { id: string }>(items: T[]) =>
  items.filter((item, i, all) => all.findIndex((x) => x.id === item.id) === i)

const HERO_SLIDES = [
  {
    id: 1,
    eyebrow: 'NEW DROP',
    headline: 'STEP INTO THE\nSPOTLIGHT',
    sub: 'Exclusive sneaker drops at prices that make sense. Free shipping over ₹999.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1440&h=900&fit=crop&auto=format',
  },
  {
    id: 2,
    eyebrow: 'AW25 COLLECTION',
    headline: 'RUN THE\nGAME',
    sub: 'Performance meets street. Nike, Adidas, Jordan — all in one place.',
    image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1440&h=900&fit=crop&auto=format',
  },
  {
    id: 3,
    eyebrow: 'MEGA SALE',
    headline: 'UP TO 63%\nOFF TODAY',
    sub: 'Best discounts of the season. COD available on all orders.',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1440&h=900&fit=crop&auto=format',
  },
]


const BRANDS = [
  'Nike', 'Adidas', 'Jordan', 'Puma', 'Converse', 'Vans',
  'Crocs', 'ASICS', 'New Balance', 'Onitsuka Tiger', 'Amiri', 'Balenciaga', 'BAPE', 'Louis Vuitton',
]

const TESTIMONIALS = [
  {
    name: 'Ananya R.',
    city: 'Bengaluru',
    rating: 5,
    quote: 'Got my Nike Air Force 1s in 2 days. Totally genuine — even the box and tags were perfect. Will definitely order again!',
  },
  {
    name: 'Rajan S.',
    city: 'Mumbai',
    rating: 5,
    quote: 'Best prices I found anywhere online. Paid via COD, no issues at all. The size guide was super helpful.',
  },
  {
    name: 'Priya K.',
    city: 'Delhi',
    rating: 4,
    quote: 'Ordered Chelsea boots — absolutely love them. Quick delivery, well-packaged. Slightly delayed but worth it.',
  },
]

function useCountdown(targetSecs: number) {
  const [secs, setSecs] = useState(targetSecs)
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          fill={i <= rating ? 'var(--warning)' : 'none'}
          color={i <= rating ? 'var(--warning)' : 'var(--text-muted)'}
        />
      ))}
    </div>
  )
}

export function HomePage({
  products = [],
  saleProducts = [],
  categories = [],
}: {
  products?: Product[]
  saleProducts?: Product[]
  categories?: DbCategory[]
}) {
  const PRODUCTS = products
  const SALE_PRODUCTS = saleProducts
  // Only categories that actually have artwork — a tile with no image looks broken.
  const CATS = categories
    // A tile with no artwork looks broken, so only show categories that have one.
    .filter((c) => c.image)
    .map((c) => ({
      label: c.name,
      count: products.filter(() => true).length,
      href: `/product-category/${c.slug}`,
      image: c.image as string,
    }))
  const [heroSlide, setHeroSlide] = useState(0)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdown = useCountdown(14 * 3600 + 22 * 60 + 9)
  const discountScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    heroTimer.current = setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current)
    }
  }, [])

  const prevSlide = () => {
    if (heroTimer.current) clearInterval(heroTimer.current)
    setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }
  const nextSlide = () => {
    if (heroTimer.current) clearInterval(heroTimer.current)
    setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
  }

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return
    ref.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  const slide = HERO_SLIDES[heroSlide]

  return (
    <div>
      {/* ── 3. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: '88vh', minHeight: 500 }}>
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === heroSlide ? 1 : 0 }}
          >
            <img
              src={s.image}
              alt={s.headline}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%)',
              }}
            />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="mx-auto max-w-[1440px] px-6 w-full">
            <div className="max-w-xl">
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 mb-4"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {slide.eyebrow}
              </span>
              <h1
                className="text-5xl md:text-[64px] font-black uppercase leading-none mb-4 text-white whitespace-pre-line"
                style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
              >
                {slide.headline}
              </h1>
              <p className="text-base md:text-lg text-white/70 mb-8 max-w-sm">{slide.sub}</p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/product-category/new-arrivals"
                  className="px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
                >
                  SHOP THE DROP
                </Link>
                <Link
                  href="/product-category/sneakers"
                  className="px-7 py-3 text-sm font-bold uppercase tracking-widest text-white border transition-opacity hover:opacity-80"
                  style={{ borderColor: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-btn)' }}
                >
                  VIEW LOOKBOOK
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-white transition-colors duration-200"
          style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-btn)' }}
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-white transition-colors duration-200"
          style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-btn)' }}
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-6 left-6 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i === heroSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                width: i === heroSlide ? 24 : 8,
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 4. USP STRIP ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { icon: Shield, label: '100% Genuine' },
              { icon: Truck, label: 'Free Shipping over ₹999' },
              { icon: RefreshCw, label: '7-Day Easy Returns' },
              { icon: CreditCard, label: 'COD Available' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 py-5 px-6 shrink-0 border-r"
                style={{ borderColor: 'var(--border)', flex: '1 0 200px' }}
              >
                <Icon size={18} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. BEST DISCOUNTS ─────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-3xl md:text-[44px] font-black uppercase tracking-tight"
                style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                BEST DISCOUNTS THIS WEEK
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Up to 63% off on top brands
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => scrollCarousel(discountScrollRef, 'left')}
                className="w-10 h-10 flex items-center justify-center border transition-colors duration-200"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-btn)',
                }}
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarousel(discountScrollRef, 'right')}
                className="w-10 h-10 flex items-center justify-center border transition-colors duration-200"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-btn)',
                }}
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={discountScrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
          >
            {uniqueById([...PRODUCTS, ...SALE_PRODUCTS]).slice(0, 8).map((p) => (
              <div key={p.id} style={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY CATEGORY ───────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl md:text-[44px] font-black uppercase tracking-tight"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              SHOP BY CATEGORY
            </h2>
            <Link
              href="/product-category/sneakers"
              className="text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              VIEW ALL →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATS.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="relative overflow-hidden group block"
                style={{ aspectRatio: '3/4', background: '#111' }}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {cat.count} products
                  </p>
                  <h3
                    className="text-xl font-black uppercase text-white"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    {cat.label}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PROMO VIDEO HERO ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ aspectRatio: '16/7' }}
      >
        <img
          src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1440&h=630&fit=crop&auto=format"
          alt="AW25 Campaign"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase text-white/60 mb-3"
            style={{ fontFamily: 'Outfit' }}
          >
            EXCLUSIVE CAMPAIGN
          </p>
          <h2
            className="text-4xl md:text-6xl font-black uppercase text-white text-center mb-6"
            style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
          >
            THE AW25 CAMPAIGN
          </h2>
          {!videoPlaying ? (
            <>
              <button
                onClick={() => setVideoPlaying(true)}
                className="video-play-btn w-20 h-20 flex items-center justify-center rounded-full text-white mb-6"
                style={{ background: 'var(--accent)' }}
                aria-label="Play video"
              >
                <Play size={28} fill="#fff" />
              </button>
              <Link
                href="/product-category/sneakers"
                className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white border transition-opacity hover:opacity-80"
                style={{ borderColor: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-btn)' }}
              >
                SHOP THE CAMPAIGN
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-full max-w-2xl h-48 flex items-center justify-center text-white/50 text-sm border"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                [Video Player — YouTube embed would appear here]
              </div>
              <button
                onClick={() => setVideoPlaying(false)}
                className="text-sm text-white/60 underline"
              >
                Close video
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── 8. SHOP BY BRAND ──────────────────────────────────────────────── */}
      <div
        className="py-10 overflow-hidden"
        style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div
          className="brand-marquee flex gap-16 items-center"
          style={{ width: 'max-content' }}
        >
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <Link
              key={`${brand}-${i}`}
              href={`/product-category/sneakers?brand=${brand}`}
              className="text-sm font-black uppercase tracking-widest shrink-0 transition-colors duration-200"
              style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>

      {/* ── 9. NEW ARRIVALS ───────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex items-end justify-between mb-8">
            <h2
              className="text-3xl md:text-[44px] font-black uppercase tracking-tight"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              NEW ARRIVALS
            </h2>
            <Link
              href="/product-category/new-arrivals"
              className="text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              VIEW ALL →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRODUCTS.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. SPLIT BANNER ──────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "MEN'S EDIT",
                desc: 'Bold styles, sharp fits',
                href: '/product-category/sneakers?gender=men',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&h=500&fit=crop&auto=format',
              },
              {
                label: "WOMEN'S EDIT",
                desc: 'Comfort meets cool',
                href: '/product-category/sneakers?gender=women',
                image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=700&h=500&fit=crop&auto=format',
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative overflow-hidden group block"
                style={{ aspectRatio: '4/3', background: '#111' }}
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                  <h3
                    className="text-3xl font-black uppercase text-white mt-1"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    {item.label}
                  </h3>
                  <span
                    className="inline-block mt-3 text-xs font-bold uppercase tracking-widest text-white border-b"
                    style={{ borderColor: 'var(--accent)' }}
                  >
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. VIDEO GRID ────────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <h2
            className="text-3xl md:text-[44px] font-black uppercase tracking-tight mb-8"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            WATCH &amp; SHOP
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[
              {
                id: 1,
                caption: 'Nike Air Force 1 — On Foot',
                product: '1',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=533&fit=crop&auto=format',
              },
              {
                id: 2,
                caption: 'Adidas Ultraboost Review',
                product: '2',
                image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300&h=533&fit=crop&auto=format',
              },
              {
                id: 3,
                caption: 'Jordan 1 Unboxing',
                product: '7',
                image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=300&h=533&fit=crop&auto=format',
              },
            ].map((v) => (
              <Link
                key={v.id}
                href={`/product/${v.product}`}
                className="relative overflow-hidden shrink-0 group"
                style={{ width: 220, aspectRatio: '9/16', background: '#111' }}
              >
                <img
                  src={v.image}
                  alt={v.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Play size={18} fill="#fff" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <p className="text-xs text-white font-medium">{v.caption}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. SALE ──────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-3xl md:text-[44px] font-black uppercase tracking-tight"
                style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                FLASH SALE
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Massive discounts — don't miss out
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 font-mono text-xl font-bold text-white"
              style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
            >
              <span className="text-xs font-medium tracking-wider mr-1">ENDS IN</span>
              {countdown}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {uniqueById([...SALE_PRODUCTS, ...PRODUCTS.slice(0, 4)]).map((p) => (
              <div key={p.id} style={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <h2
            className="text-3xl md:text-[44px] font-black uppercase tracking-tight mb-10"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            WHAT CUSTOMERS SAY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Stars rating={t.rating} />
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}>
                    <CheckCircle size={12} />
                    Verified
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-primary)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t.city}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}


export default HomePage
