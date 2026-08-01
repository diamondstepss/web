'use client'

import Link from 'next/link'
import { Search, Home, Headphones } from 'lucide-react'
import { SITE } from '@/data/site'

const SUGGESTIONS = [
  { label: 'Sneakers', to: '/product-category/sneakers' },
  { label: 'Sports Shoes', to: '/product-category/sports' },
  { label: 'Loafers', to: '/product-category/loafers' },
  { label: 'Slippers', to: '/product-category/slippers' },
  { label: 'Sale', to: '/product-category/sale' },
]

export function NotFoundPage() {
  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(70% 60% at 50% 0%, rgba(255,51,51,0.14) 0%, rgba(255,51,51,0) 60%)' }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 py-24 md:py-32 text-center">
        <p
          className="font-black leading-none select-none"
          style={{
            fontFamily: 'Outfit',
            fontSize: 'clamp(96px, 20vw, 200px)',
            letterSpacing: '-0.05em',
            color: 'var(--accent)',
            opacity: 0.16,
          }}
        >
          404
        </p>

        <h1
          className="text-3xl md:text-[44px] font-black uppercase -mt-4 md:-mt-8"
          style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          This page took a wrong step
        </h1>
        <p className="mt-4 text-sm md:text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The page you're after has moved or never existed. The shoes, thankfully, are all still here.
        </p>

        <div className="flex gap-3 flex-wrap justify-center mt-9">
          <Link
            href="/"
            className="flex items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
          >
            <Home size={16} />
            Go home
          </Link>
          <Link
            href="/shop"
            className="flex items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-widest border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
          >
            <Search size={16} />
            Shop all
          </Link>
        </div>

        <div className="mt-14">
          <p
            className="text-xs font-black uppercase tracking-widest mb-4"
            style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
          >
            Or try one of these
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s.label}
                href={s.to}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors duration-200"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <a
          href={SITE.social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-14 text-xs font-black uppercase tracking-widest"
          style={{ color: 'var(--accent)', fontFamily: 'Outfit' }}
        >
          <Headphones size={14} />
          Need help finding something?
        </a>
      </div>
    </div>
  )
}


export default NotFoundPage
