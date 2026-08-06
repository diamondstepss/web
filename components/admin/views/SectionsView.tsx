'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2, Check, Layers } from 'lucide-react'
import {
  adminFetchSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  adminFetchCollections,
  adminFetchCategories,
  SECTION_TYPES,
  SECTION_SOURCES,
  type HomepageSection,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import { AdminField, Panel, Eyebrow, PageHeading, ErrorNote, EmptyState } from '@/components/admin/shared'

const TYPE_LABEL: Record<string, string> = {
  HERO_SLIDER: 'Hero slider',
  USP_STRIP: 'Trust strip',
  PRODUCT_RAIL: 'Product rail',
  CATEGORY_TILES: 'Category tiles',
  VIDEO_HERO: 'Video hero',
  BRAND_STRIP: 'Brand strip',
  SPLIT_BANNER: 'Split banner',
  NEWSLETTER: 'Newsletter',
}

const SOURCE_LABEL: Record<string, string> = {
  FEATURED: 'Featured products',
  COLLECTION: 'A collection',
  CATEGORY: 'A category',
  SALE: 'Biggest discounts',
  NEWEST: 'Newest first',
  MANUAL: 'Hand-built section',
}

/** Only rails pull a product list; the rest are fixed layout blocks. */
const NEEDS_SOURCE = (type: string) => type === 'PRODUCT_RAIL'

/**
 * <input type="datetime-local"> speaks local time with no zone; Postgres stores
 * timestamptz. These convert between the two, so a shop in IST does not
 * accidentally schedule a banner against UTC.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Plain English, so nobody has to read two ISO strings to know what happens. */
function scheduleNote(startsAt: string | null, endsAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  const now = Date.now()
  if (startsAt && new Date(startsAt).getTime() > now) {
    return `Hidden until ${fmt(startsAt)}${endsAt ? `, then shown until ${fmt(endsAt)}` : ''}.`
  }
  if (endsAt && new Date(endsAt).getTime() < now) return `Ended ${fmt(endsAt)} — no longer shown.`
  if (endsAt) return `Showing now, hides after ${fmt(endsAt)}.`
  return 'Showing now.'
}

export default function SectionsView() {
  const confirm = useConfirm()
  const [rows, setRows] = useState<HomepageSection[]>([])
  const [slugs, setSlugs] = useState<{ collections: string[]; categories: string[] }>({ collections: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sections, collections, categories] = await Promise.all([
        adminFetchSections(),
        adminFetchCollections(),
        adminFetchCategories(),
      ])
      setRows(sections)
      setSlugs({ collections: collections.map((c) => c.slug), categories: categories.map((c) => c.slug) })
      setSelected((prev) => prev ?? sections[0]?.id ?? null)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load sections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const current = rows.find((r) => r.id === selected) ?? null

  /** Optimistic local swap, then persist — reordering should feel instant. */
  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    try {
      await reorderSections(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the new order.')
      await load()
    }
  }

  const patch = (id: string, p: Partial<HomepageSection>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))

  const saveCurrent = async () => {
    if (!current) return
    setBusy(true)
    setError(null)
    try {
      await updateSection(current.id, {
        type: current.type,
        title: current.title,
        subtitle: current.subtitle,
        source: current.source,
        source_slug: NEEDS_SOURCE(current.type) ? current.source_slug : null,
        item_limit: current.item_limit,
        is_visible: current.is_visible,
        starts_at: current.starts_at || null,
        ends_at: current.ends_at || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  const add = async () => {
    setBusy(true)
    try {
      await createSection({
        type: 'PRODUCT_RAIL',
        title: 'New rail',
        subtitle: null,
        source: 'FEATURED',
        source_slug: null,
        item_limit: 8,
        is_visible: false,
        starts_at: null,
        ends_at: null,
        position: rows.length + 1,
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add a section.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (s: HomepageSection) => {
    const ok = await confirm({
      title: 'Delete section?',
      message: `"${s.title}" will be removed from the homepage. Products and collections it points at are untouched.`,
      confirmLabel: 'Delete section',
    })
    if (!ok) return
    try {
      await deleteSection(s.id)
      if (selected === s.id) setSelected(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that section.')
    }
  }

  const visible = rows.filter((r) => r.is_visible).length

  return (
    <div>
      <PageHeading
        title="Section builder"
        description="The order here is the order they appear on the homepage. Hidden sections stay saved but stop rendering."
        meta={loading ? 'Loading…' : `${visible} of ${rows.length} visible`}
      >
        <button onClick={add} disabled={busy} className="adm-btn adm-btn-primary">
          <Plus size={13} /> Add section
        </button>
      </PageHeading>

      <ErrorNote>{error}</ErrorNote>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_314px] gap-3.5 items-start">
        {/* Ordered list */}
        <Panel className="overflow-hidden adm-rise adm-rise-1">
          {loading && (
            <div className="p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="skeleton block" style={{ height: 44, borderRadius: 9 }} />
              ))}
            </div>
          )}

          {!loading && rows.length === 0 && (
            <EmptyState
              icon={Layers}
              title="No sections yet"
              message="Add one to start building the homepage."
              action={<button onClick={add} className="adm-btn adm-btn-primary"><Plus size={13} /> Add section</button>}
            />
          )}

          {rows.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setSelected(s.id)}
              className="flex items-center gap-3 px-3.5 py-2.5 transition-colors"
              style={{
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--adm-line)',
                cursor: 'pointer',
                // Neutral raise + a red edge. A red *wash* across a whole row
                // reads as an error state rather than a selection.
                background: selected === s.id ? 'var(--adm-panel-hi)' : 'transparent',
                boxShadow: selected === s.id ? 'inset 2px 0 0 var(--adm-accent)' : 'none',
                opacity: s.is_visible ? 1 : 0.5,
              }}
            >
              <span
                className="adm-display adm-num text-[11px] shrink-0 flex items-center justify-center"
                style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--adm-inset)', color: 'var(--adm-text-3)' }}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--adm-text)' }}>{s.title}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>
                  {TYPE_LABEL[s.type] ?? s.type}
                  {NEEDS_SOURCE(s.type) && ` · ${SOURCE_LABEL[s.source] ?? s.source}`}
                  {NEEDS_SOURCE(s.type) && s.source_slug ? ` (${s.source_slug})` : ''}
                </p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); void move(i, -1) }}
                  disabled={i === 0}
                  aria-label={`Move ${s.title} up`}
                  className="adm-icon-btn"
                  style={{ width: 24, height: 24 }}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); void move(i, 1) }}
                  disabled={i === rows.length - 1}
                  aria-label={`Move ${s.title} down`}
                  className="adm-icon-btn"
                  style={{ width: 24, height: 24 }}
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    patch(s.id, { is_visible: !s.is_visible })
                    await updateSection(s.id, { is_visible: !s.is_visible })
                  }}
                  aria-label={s.is_visible ? `Hide ${s.title}` : `Show ${s.title}`}
                  className="adm-icon-btn"
                  style={{ width: 24, height: 24, color: s.is_visible ? 'var(--adm-ok)' : undefined }}
                >
                  {s.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); void remove(s) }}
                  aria-label={`Delete ${s.title}`}
                  className="adm-icon-btn"
                  style={{ width: 24, height: 24, color: 'var(--adm-bad)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </Panel>

        {/* Config for the selected section */}
        <Panel className="p-5 adm-rise adm-rise-2">
          <Eyebrow className="mb-4">Section config</Eyebrow>

          {!current ? (
            <p className="text-[12px]" style={{ color: 'var(--adm-text-3)' }}>
              Pick a section on the left to edit it.
            </p>
          ) : (
            <div className="space-y-4">
              <AdminField label="Title">
                <input value={current.title} onChange={(e) => patch(current.id, { title: e.target.value })} className="adm-input" />
              </AdminField>

              <AdminField label="Subtitle" hint="Optional line under the heading.">
                <input
                  value={current.subtitle ?? ''}
                  onChange={(e) => patch(current.id, { subtitle: e.target.value || null })}
                  className="adm-input"
                />
              </AdminField>

              <AdminField label="Type">
                <select
                  value={current.type}
                  onChange={(e) => patch(current.id, { type: e.target.value as HomepageSection['type'] })}
                  className="adm-input"
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
                  ))}
                </select>
              </AdminField>

              {NEEDS_SOURCE(current.type) && (
                <>
                  <AdminField label="Products come from">
                    <select
                      value={current.source}
                      onChange={(e) => patch(current.id, { source: e.target.value as HomepageSection['source'], source_slug: null })}
                      className="adm-input"
                    >
                      {SECTION_SOURCES.filter((s) => s !== 'MANUAL').map((s) => (
                        <option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>
                      ))}
                    </select>
                  </AdminField>

                  {(current.source === 'COLLECTION' || current.source === 'CATEGORY') && (
                    <AdminField label={current.source === 'COLLECTION' ? 'Which collection' : 'Which category'}>
                      <select
                        value={current.source_slug ?? ''}
                        onChange={(e) => patch(current.id, { source_slug: e.target.value || null })}
                        className="adm-input"
                      >
                        <option value="">— pick one —</option>
                        {(current.source === 'COLLECTION' ? slugs.collections : slugs.categories).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </AdminField>
                  )}

                  <AdminField label="How many to show" hint="Between 1 and 24.">
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={current.item_limit}
                      onChange={(e) => patch(current.id, { item_limit: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })}
                      className="adm-input adm-num"
                    />
                  </AdminField>
                </>
              )}

              {/* Scheduling. A festive rail can be set up in advance and will
                  take itself down — which is the difference between a shop that
                  looks current and one that still says Diwali in December. */}
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="Show from" hint="Optional.">
                  <input
                    type="datetime-local"
                    value={toLocalInput(current.starts_at)}
                    onChange={(e) => patch(current.id, { starts_at: fromLocalInput(e.target.value) })}
                    className="adm-input"
                  />
                </AdminField>
                <AdminField label="Hide after" hint="Optional.">
                  <input
                    type="datetime-local"
                    value={toLocalInput(current.ends_at)}
                    onChange={(e) => patch(current.id, { ends_at: fromLocalInput(e.target.value) })}
                    className="adm-input"
                  />
                </AdminField>
              </div>

              {(current.starts_at || current.ends_at) && (
                <p className="text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
                  {scheduleNote(current.starts_at, current.ends_at)}
                </p>
              )}

              <label
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ cursor: 'pointer', borderRadius: 'var(--adm-r-sm)', background: 'var(--adm-inset)', border: '1px solid var(--adm-line)' }}
              >
                <input
                  type="checkbox"
                  checked={current.is_visible}
                  onChange={(e) => patch(current.id, { is_visible: e.target.checked })}
                  style={{ accentColor: 'var(--adm-accent)' }}
                />
                <span className="text-[12.5px]" style={{ color: 'var(--adm-text)' }}>Visible on the homepage</span>
              </label>

              <div className="flex items-center gap-3">
                <button onClick={saveCurrent} disabled={busy} className="adm-btn adm-btn-primary flex-1">
                  {busy ? 'Saving…' : 'Save section'}
                </button>
                {saved && <Check size={15} style={{ color: 'var(--adm-ok)' }} />}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
