'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, SlidersHorizontal, Check } from 'lucide-react'
import {
  SORTS,
  discountSteps,
  activeCount,
  type Filters,
  type Facets,
  type SortKey,
} from '@/lib/filters'

/**
 * The filter sidebar, shared by Shop, Category and Search.
 *
 * Every option is derived from the products in scope and carries a count, so
 * you can never pick a filter that returns nothing — the previous hardcoded
 * lists offered brands and price bands the catalog didn't contain.
 */

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <p
        className="text-[11px] font-black uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), Outfit' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

/** Checkbox row with a live count of how many products match. */
function Row({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string
  count?: number
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label
      className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
      style={{ color: checked ? 'var(--text-primary)' : 'var(--text-muted)' }}
    >
      <span
        className="flex items-center justify-center shrink-0 transition-colors"
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
          background: checked ? 'var(--accent)' : 'transparent',
        }}
      >
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span className="text-[13px] flex-1 group-hover:opacity-80">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {count}
        </span>
      )}
    </label>
  )
}

export interface ProductFiltersProps {
  filters: Filters
  facets: Facets
  onChange: (next: Filters) => void
  /** Hidden when the page is already scoped to one category. */
  showCategories?: boolean
}

export function FilterPanel({ filters, facets, onChange, showCategories = true }: ProductFiltersProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const toggle = <K extends 'categories' | 'brands'>(key: K, v: string) =>
    set({
      [key]: filters[key].includes(v) ? filters[key].filter((x) => x !== v) : [...filters[key], v],
    } as Partial<Filters>)

  const toggleSize = (v: number) =>
    set({ sizes: filters.sizes.includes(v) ? filters.sizes.filter((x) => x !== v) : [...filters.sizes, v] })

  const steps = discountSteps(facets.maxDiscount)

  return (
    <div>
      {showCategories && facets.categories.length > 1 && (
        <Group title="Category">
          {facets.categories.map((c) => (
            <Row
              key={c.value}
              label={c.label}
              count={c.count}
              checked={filters.categories.includes(c.value)}
              onToggle={() => toggle('categories', c.value)}
            />
          ))}
        </Group>
      )}

      {facets.brands.length > 1 && (
        <Group title="Brand">
          {facets.brands.map((b) => (
            <Row
              key={b.value}
              label={b.value}
              count={b.count}
              checked={filters.brands.includes(b.value)}
              onToggle={() => toggle('brands', b.value)}
            />
          ))}
        </Group>
      )}

      {facets.sizes.length > 0 && (
        <Group title="Size (UK)">
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((s) => {
              const on = filters.sizes.includes(s.value)
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSize(s.value)}
                  aria-pressed={on}
                  className="text-[13px] font-semibold transition-colors"
                  style={{
                    minWidth: 40,
                    height: 36,
                    borderRadius: 8,
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    background: on ? 'var(--accent)' : 'transparent',
                    color: on ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  {s.value}
                </button>
              )
            })}
          </div>
        </Group>
      )}

      <Group title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={filters.minPrice ?? ''}
            min={facets.priceMin}
            max={facets.priceMax}
            placeholder={String(facets.priceMin)}
            onChange={(e) => set({ minPrice: e.target.value === '' ? null : Number(e.target.value) })}
            aria-label="Minimum price"
            className="w-full px-2.5 py-2 text-[13px] outline-none tabular-nums"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>–</span>
          <input
            type="number"
            inputMode="numeric"
            value={filters.maxPrice ?? ''}
            min={facets.priceMin}
            max={facets.priceMax}
            placeholder={String(facets.priceMax)}
            onChange={(e) => set({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })}
            aria-label="Maximum price"
            className="w-full px-2.5 py-2 text-[13px] outline-none tabular-nums"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />
        </div>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Catalog runs {inr(facets.priceMin)} to {inr(facets.priceMax)}
        </p>
      </Group>

      {steps.length > 0 && (
        <Group title="Discount">
          {steps.map((d) => (
            <Row
              key={d}
              label={`${d}% and above`}
              checked={filters.minDiscount === d}
              onToggle={() => set({ minDiscount: filters.minDiscount === d ? null : d })}
            />
          ))}
        </Group>
      )}

      <Group title="Availability">
        {facets.hasOutOfStock && (
          <Row
            label="In stock only"
            checked={filters.inStockOnly}
            onToggle={() => set({ inStockOnly: !filters.inStockOnly })}
          />
        )}
        {facets.hasNew && (
          <Row label="New arrivals" checked={filters.newOnly} onToggle={() => set({ newOnly: !filters.newOnly })} />
        )}
        {!facets.hasOutOfStock && !facets.hasNew && (
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Everything here is in stock.
          </p>
        )}
      </Group>
    </div>
  )
}

/** Removable chips summarising what's currently applied. */
export function ActiveChips({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onClear: () => void
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((c) => ({
      key: `c-${c}`,
      label: c.replace(/-/g, ' '),
      remove: () => set({ categories: filters.categories.filter((x) => x !== c) }),
    })),
    ...filters.brands.map((b) => ({
      key: `b-${b}`,
      label: b,
      remove: () => set({ brands: filters.brands.filter((x) => x !== b) }),
    })),
    ...filters.sizes.map((s) => ({
      key: `s-${s}`,
      label: `UK ${s}`,
      remove: () => set({ sizes: filters.sizes.filter((x) => x !== s) }),
    })),
  ]
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    chips.push({
      key: 'price',
      label: `${inr(filters.minPrice ?? 0)} – ${filters.maxPrice !== null ? inr(filters.maxPrice) : 'any'}`,
      remove: () => set({ minPrice: null, maxPrice: null }),
    })
  }
  if (filters.minDiscount !== null) {
    chips.push({ key: 'off', label: `${filters.minDiscount}%+ off`, remove: () => set({ minDiscount: null }) })
  }
  if (filters.inStockOnly) chips.push({ key: 'stock', label: 'In stock', remove: () => set({ inStockOnly: false }) })
  if (filters.newOnly) chips.push({ key: 'new', label: 'New arrivals', remove: () => set({ newOnly: false }) })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.remove}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] capitalize transition-opacity hover:opacity-75"
          style={{
            borderRadius: 99,
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            color: 'var(--accent)',
          }}
        >
          {c.label}
          <X size={12} />
        </button>
      ))}
      <button
        onClick={onClear}
        className="text-[12px] font-semibold underline underline-offset-2 ml-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Clear all
      </button>
    </div>
  )
}

/** Sort dropdown, styled to match the rest of the listing chrome. */
export function SortSelect({ value, onChange }: { value: SortKey; onChange: (s: SortKey) => void }) {
  return (
    <label className="flex items-center gap-2 shrink-0">
      <span className="sr-only">Sort by</span>
      <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="text-xs font-bold uppercase tracking-widest outline-none py-2 cursor-pointer"
        style={{ background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), Outfit' }}
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key} style={{ background: 'var(--surface)' }}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Below lg the sidebar becomes a slide-over sheet. */
export function FilterDrawer(props: ProductFiltersProps & { onClear: () => void; resultCount: number }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const n = activeCount(props.filters)

  // The portal target only exists in the browser.
  useEffect(() => setMounted(true), [])

  // Lock the page behind the sheet, and let Escape close it.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /**
   * The sheet is portalled to <body> on purpose. Its trigger sits inside a
   * listing toolbar that is `sticky z-30`, and a positioned element with a
   * z-index creates a stacking context — so an overlay rendered in place was
   * painted *below* the site header (z-50) however high its own z-index went.
   * Escaping to the body root is the only reliable fix.
   */
  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      className="fixed inset-0 z-[90] lg:hidden flex overflow-hidden"
      // Decorative absolutely-positioned elements elsewhere on the page inflate
      // the initial containing block past the viewport, so a percentage width
      // resolved to 413px on a 390px screen and pushed the panel off-screen.
      // Viewport units are immune to that.
      style={{ background: 'rgba(0,0,0,0.55)', width: '100vw' }}
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        className="ml-auto h-full flex flex-col slide-in"
        style={{
          width: 'min(86vw, 24rem)',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 h-14 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-outfit), Outfit' }}>
            Filters
          </p>
          <button onClick={() => setOpen(false)} aria-label="Close filters" style={{ color: 'var(--text-muted)' }}>
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterPanel {...props} />
        </div>

        <div className="p-4 shrink-0 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={props.onClear}
            className="px-4 py-3 text-xs font-black uppercase tracking-widest"
            style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-primary)' }}
          >
            Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit), Outfit' }}
          >
            Show {props.resultCount} result{props.resultCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 99,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-outfit), Outfit',
        }}
      >
        <SlidersHorizontal size={14} />
        Filters
        {n > 0 && (
          <span
            className="flex items-center justify-center text-[10px] text-white"
            style={{ minWidth: 18, height: 18, borderRadius: 99, background: 'var(--accent)' }}
          >
            {n}
          </span>
        )}
      </button>

      {mounted && open && createPortal(sheet, document.body)}
    </>
  )
}
