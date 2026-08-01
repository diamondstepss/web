'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, ImageIcon } from 'lucide-react'
import { adminFetchMedia, type MediaRow } from '@/lib/catalog-admin'
import { Panel, PageHeading, ErrorNote, EmptyState } from '@/components/admin/shared'

type Row = MediaRow & { products?: { title: string } | null }

export default function MediaView() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'YOUTUBE'>('ALL')

  useEffect(() => {
    adminFetchMedia()
      .then((r) => setRows(r as Row[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load media.'))
      .finally(() => setLoading(false))
  }, [])

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
        description="Every asset attached to a product. To add or remove one, open that product's gallery."
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
          <Link
            key={m.id}
            href={`/admin/products/${m.product_id}`}
            className={`adm-panel adm-panel-int overflow-hidden block adm-rise adm-rise-${Math.min((i % 4) + 1, 4)}`}
            title={`Open ${m.products?.title ?? 'product'}`}
          >
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
            <p className="px-2.5 py-2 text-[11px] truncate" style={{ color: 'var(--adm-text-2)' }}>
              {m.products?.title || m.type}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
