'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Play, ImageIcon, Trash2, Search, Loader2, Sparkles } from 'lucide-react'
import { adminFetchMedia, type MediaRow } from '@/lib/catalog-admin'
import { deleteImage, findOrphanedFiles, deleteFiles, type Orphan, type GalleryImage } from '@/lib/media'
import { Panel, PageHeading, ErrorNote, EmptyState, Eyebrow } from '@/components/admin/shared'
import { useConfirm } from '@/components/ConfirmDialog'
import { AI_CREDITS_EVENT } from '@/components/admin/AiDescriptionButton'

type Row = MediaRow & { products?: { title: string } | null }

interface PhotoPreset {
  id: string
  label: string
  description: string
}

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`

export default function MediaView() {
  const confirm = useConfirm()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'YOUTUBE'>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)

  // AI photo clean-up — hidden entirely when the add-on isn't connected.
  const [cleanConfigured, setCleanConfigured] = useState(false)
  const [presets, setPresets] = useState<PhotoPreset[]>([])
  const [creditsPerPhoto, setCreditsPerPhoto] = useState(5)
  const [cleaningId, setCleaningId] = useState<string | null>(null)

  // Orphan scan is deliberately on demand: it lists every folder in the bucket
  // and cannot be cheap, so it should not run on every visit to this page.
  const [orphans, setOrphans] = useState<Orphan[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetchMedia()
      .then((r) => setRows(r as Row[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load media.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const remove = async (m: Row) => {
    const ok = await confirm({
      title: 'Delete this asset?',
      message: `It will be removed from ${m.products?.title ?? 'the product'} and deleted from storage. This cannot be undone.`,
      confirmLabel: 'Delete asset',
    })
    if (!ok) return

    setBusyId(m.id)
    setError(null)
    try {
      await deleteImage(m as unknown as GalleryImage)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that asset.')
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    let ignore = false
    fetch('/api/admin/ai/photo')
      .then((r) => r.json())
      .then((d: { configured?: boolean; presets?: PhotoPreset[]; creditsPerPhoto?: number }) => {
        if (ignore) return
        setCleanConfigured(Boolean(d.configured))
        if (d.presets) setPresets(d.presets)
        if (typeof d.creditsPerPhoto === 'number') setCreditsPerPhoto(d.creditsPerPhoto)
      })
      .catch(() => {
        if (!ignore) setCleanConfigured(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Held per clean-up attempt so a dropped reply is not charged twice.
  const cleanIdempotencyKey = useRef<string | null>(null)

  const cleanUpPhoto = async (m: Row) => {
    const preset = presets[0]
    if (!preset) return

    const ok = await confirm({
      title: 'Clean up this photo?',
      message: `The current image will be replaced with the cleaned-up version. This uses ${creditsPerPhoto} credit${creditsPerPhoto === 1 ? '' : 's'}.`,
      confirmLabel: 'Clean up',
    })
    if (!ok) return

    setCleaningId(m.id)
    setError(null)
    cleanIdempotencyKey.current ??= crypto.randomUUID()

    try {
      const res = await fetch('/api/admin/ai/photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: m.id,
          presetId: preset.id,
          idempotencyKey: cleanIdempotencyKey.current,
        }),
      })
      const data = (await res.json()) as { creditsRemaining?: number; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Could not clean up that photo.')
        return
      }

      cleanIdempotencyKey.current = null
      window.dispatchEvent(new CustomEvent(AI_CREDITS_EVENT, { detail: { credits: data.creditsRemaining } }))
      load()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setCleaningId(null)
    }
  }

  const scan = async () => {
    setScanning(true)
    setError(null)
    try {
      setOrphans(await findOrphanedFiles())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not scan storage.')
    } finally {
      setScanning(false)
    }
  }

  const cleanUp = async () => {
    if (!orphans?.length) return
    const total = orphans.reduce((n, o) => n + o.size, 0)
    const ok = await confirm({
      title: `Delete ${orphans.length} unused file${orphans.length === 1 ? '' : 's'}?`,
      message: `${kb(total)} will be freed. These files are not used by any product, so nothing on the storefront changes.`,
      confirmLabel: 'Delete files',
    })
    if (!ok) return

    setCleaning(true)
    try {
      await deleteFiles(orphans.map((o) => o.path))
      setOrphans([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete those files.')
    } finally {
      setCleaning(false)
    }
  }

  const shown = filter === 'ALL' ? rows : rows.filter((m) => m.type === filter)
  const counts = {
    ALL: rows.length,
    IMAGE: rows.filter((m) => m.type === 'IMAGE').length,
    YOUTUBE: rows.filter((m) => m.type === 'YOUTUBE').length,
  }
  const LABEL = { ALL: 'All', IMAGE: 'Images', YOUTUBE: 'Video' } as const

  return (
    <div>
      <PageHeading
        title="Media"
        description="Every asset attached to a product. Delete one here, or open its product to add more."
        meta={loading ? 'Loading…' : `${rows.length} assets`}
      >
        <div className="flex gap-1.5">
          {(['ALL', 'IMAGE', 'YOUTUBE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="adm-btn"
              style={
                filter === t
                  ? { height: 30, padding: '0 11px', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', border: '1px solid var(--adm-accent-line)' }
                  : { height: 30, padding: '0 11px', color: 'var(--adm-text-2)', border: '1px solid var(--adm-line)' }
              }
            >
              {LABEL[t]} <span className="adm-num opacity-60">{counts[t]}</span>
            </button>
          ))}
        </div>
      </PageHeading>

      <ErrorNote>{error}</ErrorNote>

      {loading && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="skeleton block" style={{ aspectRatio: '1/1', borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <Panel>
          <EmptyState
            icon={ImageIcon}
            title={rows.length === 0 ? 'No media yet' : `No ${LABEL[filter].toLowerCase()} yet`}
            message="Open a product and upload up to 5 images, or attach a YouTube video."
            action={<Link href="/admin/products" className="adm-btn adm-btn-primary">Go to products</Link>}
          />
        </Panel>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))' }}>
        {shown.map((m, i) => (
          <div
            key={m.id}
            className={`adm-panel overflow-hidden adm-rise adm-rise-${Math.min((i % 4) + 1, 4)}`}
            style={{ position: 'relative' }}
          >
            <Link href={`/admin/products/${m.product_id}`} title={`Open ${m.products?.title ?? 'product'}`}>
              <div style={{ aspectRatio: '1/1', background: 'var(--adm-inset)', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.type === 'YOUTUBE' ? (m.alt ?? m.url) : m.url}
                  alt={m.products?.title ?? ''}
                  className="w-full h-full object-cover"
                />
                {m.type === 'YOUTUBE' && (
                  <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.38)' }}>
                    <span
                      className="flex items-center justify-center"
                      style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.25)' }}
                    >
                      <Play size={13} color="#fff" fill="#fff" />
                    </span>
                  </span>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-1 px-2.5 py-2">
              <p className="text-[11px] truncate flex-1" style={{ color: 'var(--adm-text-2)' }}>
                {m.products?.title || m.type}
              </p>
              {cleanConfigured && m.type === 'IMAGE' && (
                <button
                  onClick={() => cleanUpPhoto(m)}
                  disabled={cleaningId === m.id || busyId === m.id}
                  aria-label={`Clean up photo from ${m.products?.title ?? 'product'} with AI`}
                  title={`Clean up with AI — ${creditsPerPhoto} credit${creditsPerPhoto === 1 ? '' : 's'}`}
                  className="adm-icon-btn shrink-0"
                  style={{ width: 22, height: 22, color: 'var(--adm-accent)' }}
                >
                  {cleaningId === m.id ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                </button>
              )}
              <button
                onClick={() => remove(m)}
                disabled={busyId === m.id || cleaningId === m.id}
                aria-label={`Delete asset from ${m.products?.title ?? 'product'}`}
                className="adm-icon-btn shrink-0"
                style={{ width: 22, height: 22, color: 'var(--adm-bad)' }}
              >
                {busyId === m.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Unused files ──────────────────────────────────────────────────── */}
      <Panel className="p-5 mt-4 adm-rise adm-rise-4">
        <Eyebrow className="mb-1.5">Storage housekeeping</Eyebrow>
        <p className="text-[12px] mb-3.5 max-w-2xl leading-relaxed" style={{ color: 'var(--adm-text-2)' }}>
          Files can be left behind in storage when a product is deleted, or when an upload half-finishes.
          They are invisible everywhere else and still count against your storage. This finds them.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={scan} disabled={scanning} className="adm-btn adm-btn-ghost">
            {scanning ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            {scanning ? 'Scanning…' : 'Scan storage'}
          </button>

          {orphans !== null && orphans.length > 0 && (
            <button onClick={cleanUp} disabled={cleaning} className="adm-btn adm-btn-danger">
              {cleaning ? 'Deleting…' : `Delete ${orphans.length} unused file${orphans.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>

        {orphans !== null && (
          <p className="text-[11.5px] mt-3" style={{ color: orphans.length ? 'var(--adm-warn)' : 'var(--adm-ok)' }}>
            {orphans.length === 0
              ? 'Nothing unused — every file in storage belongs to a product.'
              : `${orphans.length} unused file${orphans.length === 1 ? '' : 's'}, ${kb(
                  orphans.reduce((n, o) => n + o.size, 0),
                )} in total.`}
          </p>
        )}
      </Panel>
    </div>
  )
}
