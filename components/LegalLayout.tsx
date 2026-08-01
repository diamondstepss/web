'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { SITE, POLICY_PAGES } from '@/data/site'

/**
 * Shell for the four policy pages. Gives them a shared sidebar so a customer
 * reading the return policy can jump straight to shipping, and keeps the prose
 * styling in exactly one place.
 *
 * NOTE: the copy in these pages is a working draft written to match how the
 * store actually operates. Have it reviewed before go-live — policy pages are
 * checked during Cashfree merchant review.
 */
export default function LegalLayout({
  title,
  lede,
  updated,
  children,
}: {
  title: string
  lede?: string
  updated: string
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero eyebrow="Customer Care" title={title} lede={lede} crumbs={[{ label: title }]} compact />

      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
              >
                Policies
              </p>
              <nav className="flex flex-col" style={{ borderTop: '1px solid var(--border)' }}>
                {POLICY_PAGES.map((p) => {
                  const active = pathname === p.slug
                  return (
                    <Link
                      key={p.slug}
                      href={p.slug}
                      className="py-2.5 text-sm transition-colors duration-150"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {p.label}
                    </Link>
                  )
                })}
              </nav>

              <div
                className="mt-8 p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Need help?
                </p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {SITE.hours}
                </p>
                <a
                  href={SITE.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-black uppercase tracking-wider text-white"
                  style={{ background: '#25d366', borderRadius: 'var(--radius-btn)' }}
                >
                  <MessageCircle size={14} />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
              Last updated: {updated}
            </p>
            <div className="legal-prose max-w-2xl">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Section heading used inside legal pages. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-lg font-black uppercase mb-3"
        style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {children}
      </div>
    </section>
  )
}

/** Bulleted list with the accent marker used across policy pages. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden style={{ color: 'var(--accent)' }}>
            —
          </span>
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  )
}
