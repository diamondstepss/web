import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

/**
 * Editorial page opener.
 *
 * Deliberately NOT the flat two-tone banner every WordPress theme ships: there
 * is no hard edge between hero and page. The background fades into the page
 * colour, an accent orb drifts behind the type, and content animates up on
 * load. Optional artwork sits beside the text rather than behind it.
 */
export default function PageHero({
  eyebrow,
  title,
  lede,
  image,
  crumbs = [],
  children,
  align = 'left',
  compact = false,
}: {
  eyebrow?: string
  title: string
  lede?: string
  image?: string
  crumbs?: Crumb[]
  children?: ReactNode
  align?: 'left' | 'center'
  /** Tighter vertical rhythm for utility pages that lead with their content. */
  compact?: boolean
}) {
  const centered = align === 'center'

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Soft accent field — bleeds away instead of stopping at a hard line */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: centered
            ? 'radial-gradient(80% 70% at 50% -20%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%)'
            : 'radial-gradient(60% 90% at 12% -30%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 72%)',
        }}
      />
      <div
        aria-hidden
        className="absolute orb-drift pointer-events-none"
        style={{
          top: '-40%',
          right: centered ? '30%' : '4%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 68%)',
          filter: 'blur(10px)',
        }}
      />

      <div
        className={`relative mx-auto max-w-[1440px] px-6 ${image ? 'grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center' : ''}`}
        style={{ paddingTop: compact ? 52 : 72, paddingBottom: compact ? 40 : image ? 72 : 56 }}
      >
        <div className={centered ? 'text-center mx-auto max-w-2xl' : ''}>
          {crumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className={`flex items-center gap-1.5 mb-6 text-xs flex-wrap fade-up ${centered ? 'justify-center' : ''}`}
            >
              <Link href="/" className="hover:underline" style={{ color: 'var(--text-muted)' }}>
                Home
              </Link>
              {crumbs.map((c) => (
                <span key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                  {c.to ? (
                    <Link href={c.to} className="hover:underline" style={{ color: 'var(--text-muted)' }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {eyebrow && (
            <div
              className={`flex items-center gap-3 mb-5 fade-up ${centered ? 'justify-center' : ''}`}
              style={{ animationDelay: '.05s' }}
            >
              <span aria-hidden className="shimmer-line" style={{ height: 2, width: 34 }} />
              <span
                className="text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
              >
                {eyebrow}
              </span>
            </div>
          )}

          <h1
            className="font-black uppercase leading-[0.9] fade-up"
            style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: compact ? 'clamp(34px, 5vw, 52px)' : 'clamp(38px, 6vw, 68px)',
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              animationDelay: '.1s',
            }}
          >
            {title}
          </h1>

          {lede && (
            <p
              className={`mt-5 text-base leading-relaxed fade-up ${centered ? 'mx-auto' : ''}`}
              style={{ color: 'var(--text-muted)', maxWidth: 520, animationDelay: '.15s' }}
            >
              {lede}
            </p>
          )}

          {children && (
            <div className="mt-9 fade-up" style={{ animationDelay: '.2s' }}>
              {children}
            </div>
          )}
        </div>

        {image && (
          <div className="relative hidden lg:block fade-up" style={{ animationDelay: '.2s' }}>
            <div
              aria-hidden
              className="absolute inset-x-10 bottom-3"
              style={{ height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', filter: 'blur(26px)' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              aria-hidden
              className="relative w-full h-auto float-y"
              style={{ borderRadius: 26, maxHeight: 380, objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </section>
  )
}

/** Stat tiles used under page heroes. */
export function StatRow({
  stats,
}: {
  stats: { label: string; value: string; accent?: boolean }[]
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="px-5 py-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
          }}
        >
          <p
            className="text-2xl md:text-3xl font-black"
            style={{
              fontFamily: 'var(--font-outfit)',
              letterSpacing: '-0.02em',
              color: s.accent ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            {s.value}
          </p>
          <p
            className="mt-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
