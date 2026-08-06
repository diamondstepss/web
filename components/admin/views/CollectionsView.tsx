'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, FolderOpen, Pencil } from 'lucide-react'
import {
  adminFetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  slugify,
  type Collection,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import { AdminField, Panel, Eyebrow, PageHeading, ErrorNote, EmptyState } from '@/components/admin/shared'
import { EditDialog } from '@/components/admin/EditDialog'

export default function CollectionsView() {
  const confirm = useConfirm()
  const [editing, setEditing] = useState<(typeof rows)[number] | null>(null)
  const [rows, setRows] = useState<(Collection & { count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await adminFetchCollections())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load collections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <PageHeading
        title="Collections"
        description="Curated groups that feed the homepage rails. A category says what a product is — a collection says where you're promoting it."
        meta={loading ? 'Loading…' : `${rows.length} total`}
      />

      <ErrorNote>{error}</ErrorNote>

      <Panel className="p-5 mb-3.5 adm-rise adm-rise-1">
        <Eyebrow className="mb-4">New collection</Eyebrow>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError(null)
            try {
              await createCollection({ slug: slugify(name), name: name.trim() })
              setName('')
              await load()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed.')
            } finally {
              setBusy(false)
            }
          }}
          className="flex gap-3 items-end flex-wrap"
        >
          <div style={{ minWidth: 250 }}>
            <AdminField label="Collection name" hint={name ? `URL will be /${slugify(name)}` : 'e.g. Monsoon Edit, Festive Picks'}>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Monsoon Edit" className="adm-input" />
            </AdminField>
          </div>
          <button type="submit" disabled={busy} className="adm-btn adm-btn-primary" style={{ marginBottom: 22 }}>
            <Plus size={13} /> {busy ? 'Saving…' : 'Add collection'}
          </button>
        </form>
      </Panel>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="skeleton block" style={{ height: 132, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <Panel>
          <EmptyState
            icon={FolderOpen}
            title="No collections yet"
            message="Create one, then point a homepage rail at it from the Sections builder."
          />
        </Panel>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rows.map((c, i) => (
          <Panel key={c.id} interactive className={`p-5 adm-rise adm-rise-${Math.min(i + 1, 4)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[13px]" style={{ color: 'var(--adm-text)' }}>{c.name}</p>
                <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--adm-text-3)' }}>/{c.slug}</p>
              </div>
              <span className="adm-badge adm-badge-acc shrink-0 adm-num">
                {c.count} item{c.count === 1 ? '' : 's'}
              </span>
            </div>

            {c.description && (
              <p className="text-[11.5px] mt-2.5 leading-relaxed" style={{ color: 'var(--adm-text-2)' }}>{c.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--adm-line)' }}>
              {/* A switch, not a badge. The old version looked like a status
                  label, so nobody realised a collection could be hidden. */}
              <button
                onClick={async () => {
                  await updateCollection(c.id, { is_active: !c.is_active })
                  await load()
                }}
                title={c.is_active ? 'Hide from the storefront' : 'Show on the storefront'}
                className="adm-btn adm-btn-ghost"
                style={{ height: 27, padding: '0 10px' }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 7, height: 7, borderRadius: 99,
                    background: c.is_active ? 'var(--adm-ok)' : 'var(--adm-text-3)',
                  }}
                />
                {c.is_active ? 'Live' : 'Hidden'}
              </button>

              <span className="flex gap-2">
                <button
                  onClick={() => setEditing(c)}
                  className="adm-btn adm-btn-ghost"
                  style={{ height: 27, padding: '0 10px' }}
                >
                  <Pencil size={12} /> Edit
                </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Delete collection?',
                    message: `"${c.name}" will be removed from the homepage rails. The products stay in the catalog.`,
                    confirmLabel: 'Delete collection',
                  })
                  if (ok) {
                    await deleteCollection(c.id)
                    await load()
                  }
                }}
                className="adm-btn adm-btn-danger"
                style={{ height: 27, padding: '0 10px' }}
                >
                  Delete
                </button>
              </span>
            </div>
          </Panel>
        ))}
      </div>

      {editing && (
        <EditDialog
          title="Edit collection"
          value={editing as unknown as Record<string, unknown>}
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'slug', label: 'URL slug', mono: true, hint: 'Changing this breaks any existing links to the collection.' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'image', label: 'Cover image', type: 'image', hint: 'Used by homepage rails that show a cover. Generate one if you have no photo yet.' },
          ]}
          onSave={async (patch) => {
            await updateCollection(editing.id, patch)
            await load()
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
