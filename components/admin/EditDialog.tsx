'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ErrorNote } from '@/components/admin/shared'
import { ImageField } from '@/components/admin/ImageField'

/**
 * One editor for every list in the admin.
 *
 * Categories, collections, coupons and sections could all be created, toggled
 * and deleted — but never changed. A typo in a collection name meant deleting
 * it and losing every product already assigned to it.
 *
 * Rather than four near-identical forms that would drift apart, this takes a
 * field spec. Adding a field to an entity is one line, and the layout, the
 * saving state and the error handling stay the same everywhere.
 *
 * Rendered through a portal for the same reason the mobile nav is: the admin
 * shell is `sticky` with a `z-index`, which makes it a stacking context, and
 * anything inside it cannot escape however high its own z-index goes.
 *
 * Which creates the opposite problem. admin.css is scoped under `.adm`, and a
 * portal mounts on document.body — outside it. Without the class below, every
 * `var(--adm-*)` resolved to nothing and the dialog rendered fully transparent,
 * with the page showing straight through it. `.adm` also sets its own
 * background, so the scrim is applied inline to win over it.
 */

export interface Field {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'image'
  hint?: string
  required?: boolean
  mono?: boolean
  options?: { value: string; label: string }[]
  /** Numbers only — a value the field cannot go below. */
  min?: number
}

export function EditDialog<T extends Record<string, unknown>>({
  title,
  fields,
  value,
  onSave,
  onClose,
}: {
  title: string
  fields: Field[]
  value: T
  onSave: (patch: Partial<T>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, value[f.key] ?? (f.type === 'checkbox' ? false : '')])),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    // Only what actually changed. Sending the whole object would overwrite
    // columns this dialog does not know about.
    const patch: Record<string, unknown> = {}
    for (const f of fields) {
      const next = f.type === 'number' ? Number(form[f.key]) : form[f.key]
      const before = value[f.key] ?? (f.type === 'checkbox' ? false : '')
      if (String(next) !== String(before)) {
        patch[f.key] =
          f.type === 'text' || f.type === 'textarea' || f.type === 'image'
            ? String(next).trim() || null
            : next
      }
    }

    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }

    try {
      await onSave(patch as Partial<T>)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
      setBusy(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="adm fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto"
        style={{
          background: 'var(--adm-panel)',
          border: '1px solid var(--adm-line)',
          borderRadius: 'var(--adm-r)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--adm-line)' }}
        >
          <h2 className="adm-display text-[15px]" style={{ color: 'var(--adm-text)' }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} className="adm-icon-btn" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <ErrorNote>{error}</ErrorNote>

          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="block mb-1.5 text-[11.5px] font-medium" style={{ color: 'var(--adm-text-2)' }}>
                {f.label}
              </span>

              {f.type === 'image' ? (
                <ImageField
                  value={String(form[f.key] ?? '')}
                  onChange={(url) => setForm((st) => ({ ...st, [f.key]: url }))}
                />
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  required={f.required}
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="adm-input"
                />
              ) : f.type === 'select' ? (
                <select
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="adm-input"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.key])}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.checked }))}
                  />
                  <span className="text-[12px]" style={{ color: 'var(--adm-text-2)' }}>
                    {f.hint}
                  </span>
                </span>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  min={f.min}
                  required={f.required}
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  className={`adm-input ${f.mono ? 'font-mono text-[12px]' : ''} ${f.type === 'number' ? 'adm-num' : ''}`}
                />
              )}

              {f.hint && f.type !== 'checkbox' && (
                <span className="block mt-1.5 text-[10.5px] leading-snug" style={{ color: 'var(--adm-text-3)' }}>
                  {f.hint}
                </span>
              )}
            </label>
          ))}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className="adm-btn adm-btn-primary flex-1">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="adm-btn adm-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
