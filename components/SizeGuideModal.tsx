'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Ruler, ArrowUpRight } from 'lucide-react'
import { MENS_SIZES, WOMENS_SIZES, FIT_NOTES } from '@/data/sizes'

/**
 * Size chart shown from the product page.
 *
 * A modal rather than a link to /size-guide: you consult this while choosing a
 * size, and navigating away loses the size and quantity you'd already picked.
 *
 * Portalled to <body> because the trigger sits inside the product's sticky
 * detail column — a positioned ancestor with a z-index would otherwise trap the
 * overlay beneath the site header.
 */
export default function SizeGuideModal({
  open,
  onClose,
  /** Sizes (EU — the store's size system) this product actually stocks, highlighted in the table. */
  availableSizes = [],
}: {
  open: boolean
  onClose: () => void
  availableSizes?: number[]
}) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'mens' | 'womens'>('mens')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => closeRef.current?.focus(), 40)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  const rows = tab === 'mens' ? MENS_SIZES : WOMENS_SIZES

  const modal = (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 confirm-backdrop"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', width: '100vw' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="w-full flex flex-col confirm-pop"
        style={{
          maxWidth: 560,
          maxHeight: 'min(86vh, 720px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          boxShadow: '0 32px 64px -24px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 h-14 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            id="size-guide-title"
            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-outfit), Outfit', color: 'var(--text-primary)' }}
          >
            <Ruler size={15} style={{ color: 'var(--accent)' }} />
            Size guide
          </h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close size guide" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Men's / women's */}
          <div className="flex gap-1.5 mb-4">
            {(['mens', 'womens'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className="px-4 py-2 text-[11px] font-black uppercase tracking-widest"
                style={{
                  borderRadius: 99,
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
                  color: tab === t ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-outfit), Outfit',
                }}
              >
                {t === 'mens' ? "Men's" : "Women's"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['EU', 'UK', 'US', 'Foot length'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), Outfit' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  // Highlight the rows this product can actually be bought in.
                  const stocked = availableSizes.includes(Number(r.eu))
                  return (
                    <tr
                      key={r.uk}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: stocked ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'transparent',
                      }}
                    >
                      <td
                        className="px-3 py-2.5 font-bold tabular-nums"
                        style={{ color: stocked ? 'var(--accent)' : 'var(--text-primary)' }}
                      >
                        EU {r.eu}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>{r.uk}</td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>{r.us}</td>
                      <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>{r.cm} cm</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {availableSizes.length > 0 && (
            <p className="mt-3 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent)' }}>Highlighted</span> rows are the sizes in stock for this product.
            </p>
          )}

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <p
              className="text-[11px] font-black uppercase tracking-widest mb-2.5"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), Outfit' }}
            >
              Getting the fit right
            </p>
            <ul className="space-y-1.5">
              {FIT_NOTES.map((n) => (
                <li key={n} className="flex gap-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)' }}>·</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-5 py-4 shrink-0 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href="/size-guide"
            className="flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            How to measure your foot <ArrowUpRight size={13} />
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit), Outfit' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
