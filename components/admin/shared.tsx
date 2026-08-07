'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { fetchAllOrders, type AdminOrder } from '@/lib/admin'

/**
 * Admin primitives. Every section composes these rather than re-declaring the
 * same panel, table and input styling, so a change to the look lands once.
 *
 * Visual styling lives in app/admin.css under the `adm-` namespace.
 */

/** Indian digit grouping — ₹1,84,500, not ₹184,500. */
export const inr = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`

/** Compact table cell: "7 Aug '26". Pair with fullDateTime() as a tooltip. */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })

/** The time half of a shortDate() cell: "2:45 pm" — printed underneath the
 *  date rather than folded into one string, so both stay legible at table
 *  size instead of one long line getting truncated. */
export const shortTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase()

/** The exact moment, for a title="" tooltip on a shortDate() cell. */
export const fullDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * An on/off switch, for the one-click toggles scattered through the admin
 * (live/draft, featured, etc.) — a colour-coded pill reads as a status label
 * first and a button second; this reads as a button first.
 */
export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className="relative inline-flex shrink-0 transition-colors"
      style={{
        width: 34,
        height: 19,
        borderRadius: 99,
        background: checked ? 'var(--adm-ok)' : 'var(--adm-line-strong)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        aria-hidden
        className="absolute transition-transform"
        style={{
          top: 2,
          left: 2,
          width: 15,
          height: 15,
          borderRadius: 99,
          background: '#fff',
          transform: checked ? 'translateX(15px)' : 'translateX(0)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}

/** Compact form for chart axes and tight cells: ₹1.8L, ₹24.5k. */
export const inrShort = (n: number) => {
  const v = Number(n)
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(v % 1e7 === 0 ? 0 : 1)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(v % 1e5 === 0 ? 0 : 1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  return `₹${v}`
}

export function Panel({
  className = '',
  interactive = false,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div className={`adm-panel ${interactive ? 'adm-panel-int' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Small uppercase label used above panels and inside cards. */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`adm-eyebrow ${className}`}>{children}</p>
}

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[11.5px] font-medium" style={{ color: 'var(--adm-text-2)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1.5 text-[10.5px] leading-snug" style={{ color: 'var(--adm-text-3)' }}>
          {hint}
        </span>
      )}
    </label>
  )
}

/**
 * Page header. `meta` is the live status line on the right; `description` sits
 * under the title and explains what the section is for.
 */
export function PageHeading({
  title,
  description,
  meta,
  live,
  children,
}: {
  title: string
  description?: string
  meta?: string
  /** Shows a pulsing dot beside the meta text — for "reading from the database". */
  live?: boolean
  children?: React.ReactNode
}) {
  return (
    <header className="adm-rise mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="adm-display text-[22px] sm:text-[26px] leading-none" style={{ color: 'var(--adm-text)' }}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-[12.5px] leading-relaxed max-w-xl" style={{ color: 'var(--adm-text-2)' }}>
              {description}
            </p>
          )}
        </div>
        {meta && (
          <span className="flex items-center gap-2 text-[11.5px] shrink-0" style={{ color: 'var(--adm-text-3)' }}>
            {live && <span className="adm-dot" aria-hidden />}
            {meta}
          </span>
        )}
      </div>

      {/*
        Actions get their own row and wrap.

        Sitting inline with the title, a search field plus a button overflowed
        a 390px screen — the "New product" button was cut off the right edge
        with no way to reach it.
      */}
      {children && (
        <div className="flex items-center gap-2 flex-wrap mt-4 [&_input]:min-w-0 [&>*]:shrink-0">
          {children}
        </div>
      )}
    </header>
  )
}

export function ErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      className="text-[12px] px-4 py-3 mb-4 adm-rise"
      style={{
        background: 'color-mix(in srgb, var(--adm-bad) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--adm-bad) 28%, transparent)',
        color: 'var(--adm-bad)',
        borderRadius: 'var(--adm-r-sm)',
      }}
    >
      {children}
    </p>
  )
}

/** Empty states get an icon, a reason and a way forward — never bare text. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ComponentType<{ size?: number | string }>
  title: string
  message?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-16">
      <span
        className="flex items-center justify-center mb-4"
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: 'var(--adm-panel-hi)',
          border: '1px solid var(--adm-line)',
          color: 'var(--adm-text-3)',
        }}
      >
        <Icon size={19} />
      </span>
      <p className="adm-display text-[15px]" style={{ color: 'var(--adm-text)' }}>{title}</p>
      {message && (
        <p className="mt-1.5 text-[12.5px] max-w-sm leading-relaxed" style={{ color: 'var(--adm-text-2)' }}>
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Shimmering placeholder rows, so a slow fetch doesn't read as a broken page. */
export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3.5 py-3">
              <span
                className="block skeleton"
                style={{ height: 9, borderRadius: 5, width: c === 0 ? '55%' : c === cols - 1 ? '40%' : '75%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Orders fetch, shared by Dashboard, Orders and Reports. */
export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrders(await fetchAllOrders())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { orders, loading, error, reload: load }
}

/** Page numbers to render, with `'…'` standing in for a run that's skipped.
 *  Always shows the first, the last, and a small window around the current
 *  page, so the control stays a fixed, glanceable width regardless of
 *  whether there are 4 pages or 400. */
export function paginationRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const pages = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out: (number | '…')[] = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) out.push('…')
    out.push(p)
    prev = p
  }
  return out
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100]

/**
 * Backend pagination footer: rows-per-page, a "showing X–Y of Z" readout,
 * and page navigation. One component because every list that grows past a
 * page needs the identical three pieces, and a change to how one looks
 * should not require finding every table that copied it.
 */
export function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const btn = (active = false) =>
    ({
      height: 30,
      minWidth: 30,
      padding: '0 8px',
      borderRadius: 'var(--adm-r-sm)',
      border: `1px solid ${active ? 'var(--adm-accent-line)' : 'var(--adm-line)'}`,
      background: active ? 'var(--adm-accent-soft)' : 'transparent',
      color: active ? 'var(--adm-accent)' : 'var(--adm-text-2)',
      fontWeight: active ? 700 : 500,
    }) as const

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderTop: '1px solid var(--adm-line)' }}>
      <div className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--adm-text-3)' }}>
        <span>Rows per page</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="adm-input"
          style={{ height: 28, width: 'auto', padding: '0 8px' }}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="whitespace-nowrap">
          {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onPageChange(1)} disabled={page === 1} className="adm-icon-btn" style={btn()} aria-label="First page">
            <ChevronsLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="adm-icon-btn"
            style={btn()}
            aria-label="Previous page"
          >
            <ChevronLeft size={13} />
          </button>

          {paginationRange(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-[11.5px]" style={{ color: 'var(--adm-text-3)' }}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className="text-[11.5px] transition-colors"
                style={btn(p === page)}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="adm-icon-btn"
            style={btn()}
            aria-label="Next page"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="adm-icon-btn"
            style={btn()}
            aria-label="Last page"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
