'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Tag, ImageOff, X, Pencil } from 'lucide-react'
import type { DbCategory } from '@/lib/catalog'
import {
  adminFetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  slugify,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import { AdminField, Panel, Eyebrow, PageHeading, ErrorNote, EmptyState } from '@/components/admin/shared'
import { EditDialog } from '@/components/admin/EditDialog'

export default function CategoriesView() {
  const confirm = useConfirm()
  const [editing, setEditing] = useState<DbCategory | null>(null)
  const [rows, setRows] = useState<DbCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', image: '' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await adminFetchCategories())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load categories.')
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
        title="Categories"
        description="What a product is — sneakers, loafers, sandals. These drive the storefront's category pages."
        meta={loading ? 'Loading…' : `${rows.length} total`}
      >
        <button onClick={() => setAdding((v) => !v)} className={`adm-btn ${adding ? 'adm-btn-ghost' : 'adm-btn-primary'}`}>
          {adding ? <><X size={13} /> Close</> : <><Plus size={13} /> New category</>}
        </button>
      </PageHeading>

      <ErrorNote>{error}</ErrorNote>

      {adding && (
        <Panel className="p-5 mb-3.5 adm-rise">
          <Eyebrow className="mb-4">New category</Eyebrow>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setError(null)
              try {
                await createCategory({
                  name: form.name.trim(),
                  slug: form.slug.trim() || slugify(form.name),
                  image: form.image.trim() || null,
                })
                setForm({ name: '', slug: '', image: '' })
                setAdding(false)
                await load()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Save failed.')
              } finally {
                setBusy(false)
              }
            }}
            className="grid sm:grid-cols-3 gap-4 items-start"
          >
            <AdminField label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="adm-input" placeholder="Sneakers" />
            </AdminField>
            <AdminField label="URL slug" hint="Generated from the name if left blank.">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={slugify(form.name) || 'auto'}
                className="adm-input font-mono text-[12px]"
              />
            </AdminField>
            <AdminField label="Image URL" hint="Shown on the homepage category tile.">
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="adm-input" />
            </AdminField>
            <button type="submit" disabled={busy} className="adm-btn adm-btn-primary sm:col-span-3 justify-self-start">
              {busy ? 'Saving…' : 'Create category'}
            </button>
          </form>
        </Panel>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="skeleton block" style={{ height: 186, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <Panel>
          <EmptyState
            icon={Tag}
            title="No categories yet"
            message="Categories group products by what they are, and give each one its own storefront page."
            action={<button onClick={() => setAdding(true)} className="adm-btn adm-btn-primary"><Plus size={13} /> New category</button>}
          />
        </Panel>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rows.map((c, i) => (
          <Panel key={c.id} interactive className={`overflow-hidden adm-rise adm-rise-${Math.min(i + 1, 4)}`}>
            <div className="flex items-center justify-center" style={{ height: 118, background: 'var(--adm-inset)' }}>
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageOff size={19} style={{ color: 'var(--adm-text-3)' }} />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[13px]" style={{ color: 'var(--adm-text)' }}>{c.name}</p>
                  <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--adm-text-3)' }}>/{c.slug}</p>
                </div>
                <button
                  onClick={async () => {
                    await updateCategory(c.id, { is_active: !c.is_active })
                    await load()
                  }}
                  className="adm-btn adm-btn-ghost shrink-0"
                  style={{ height: 25, padding: '0 9px' }}
                  title={c.is_active ? 'Hide from the storefront' : 'Show on the storefront'}
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
              </div>
              <div className="flex justify-end gap-2 mt-3.5 pt-3.5" style={{ borderTop: '1px solid var(--adm-line)' }}>
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
                      title: 'Delete category?',
                      message: `"${c.name}" will be removed. Products in it stay, but lose this category.`,
                      confirmLabel: 'Delete category',
                    })
                    if (ok) {
                      await deleteCategory(c.id)
                      await load()
                    }
                  }}
                  className="adm-btn adm-btn-danger"
                  style={{ height: 27, padding: '0 10px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {editing && (
        <EditDialog
          title="Edit category"
          value={editing as unknown as Record<string, unknown>}
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'slug', label: 'URL slug', mono: true, hint: 'Changing this breaks existing links and any saved SEO ranking.' },
            { key: 'image', label: 'Image URL', hint: 'Optional cover image.' },
            { key: 'position', label: 'Order', type: 'number', min: 0, hint: 'Lower numbers appear first.' },
          ]}
          onSave={async (patch) => {
            await updateCategory(editing.id, patch)
            await load()
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
