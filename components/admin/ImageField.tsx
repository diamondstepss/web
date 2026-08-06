'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

/**
 * A URL box with an AI generator attached.
 *
 * Used wherever the admin asks for cover artwork — category tiles, collection
 * covers. Pasting a URL still works; this only adds the option of not having to
 * find one.
 *
 * What it generates is a decorative backdrop, never a product. The service
 * refuses to draw footwear in banners for the same reason it will not invent a
 * product photo: a shop selling real branded stock cannot show a customer
 * something it does not have. So these are surfaces, light and colour, with
 * space left for a title to sit over them.
 */

interface Occasion {
  id: string
  label: string
  season: string
}

interface Format {
  id: string
  label: string
  aspect: string
}

export function ImageField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<{ occasions: Occasion[]; formats: Format[] } | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [occasion, setOccasion] = useState('plain-studio')
  const [format, setFormat] = useState('square')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null)

  // Held across retries so a dropped reply is not charged twice.
  const idempotencyKey = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/admin/ai/banner')
      .then((r) => r.json())
      .then((d: { configured?: boolean; occasions?: Occasion[]; formats?: Format[]; creditsPerBanner?: number }) => {
        if (!alive) return
        setConfigured(Boolean(d.configured))
        if (d.occasions && d.formats) setOptions({ occasions: d.occasions, formats: d.formats })
      })
      .catch(() => alive && setConfigured(false))
    return () => {
      alive = false
    }
  }, [])

  const generate = async () => {
    setBusy(true)
    setNote(null)
    idempotencyKey.current ??= crypto.randomUUID()

    try {
      const res = await fetch('/api/admin/ai/banner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ occasion, format, idempotencyKey: idempotencyKey.current }),
      })
      const data = (await res.json()) as {
        url?: string
        temporaryUrl?: string
        creditsCharged?: number
        creditsRemaining?: number
        error?: string
      }

      if (!res.ok) {
        setNote({ text: data.error ?? 'That did not work.', tone: 'bad' })
        // A generated-but-unsaved image is still usable if grabbed quickly.
        if (data.temporaryUrl) onChange(data.temporaryUrl)
        return
      }

      onChange(data.url ?? '')
      setCredits(data.creditsRemaining ?? null)
      idempotencyKey.current = null
      setOpen(false)
      setNote({
        text: `${data.creditsCharged ?? 1} credit used${
          data.creditsRemaining !== undefined ? ` · ${data.creditsRemaining} left` : ''
        }.`,
        tone: 'ok',
      })
    } catch {
      setNote({ text: 'Could not reach the server.', tone: 'bad' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="adm-input flex-1"
        />
        {configured && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="adm-btn adm-btn-ghost shrink-0"
            title="Generate a background with AI"
          >
            <Sparkles size={13} />
          </button>
        )}
      </div>

      {/* Preview. A broken URL is otherwise only discovered on the storefront. */}
      {value && (
        <div
          className="mt-2 overflow-hidden"
          style={{ borderRadius: 'var(--adm-r-sm)', border: '1px solid var(--adm-line)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="w-full block"
            style={{ maxHeight: 120, objectFit: 'cover' }}
            onError={(e) => ((e.currentTarget.style.display = 'none'))}
          />
        </div>
      )}

      {open && options && (
        <div
          className="mt-2 p-3 space-y-2.5"
          style={{ background: 'var(--adm-inset)', border: '1px solid var(--adm-line)', borderRadius: 'var(--adm-r-sm)' }}
        >
          <p className="text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
            A decorative background with space for a title. It never draws products — a generated
            shoe is one you cannot actually sell.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block mb-1 text-[10.5px]" style={{ color: 'var(--adm-text-3)' }}>Style</span>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="adm-input" style={{ height: 32 }}>
                {options.occasions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                    {o.season !== 'Any time' ? ` · ${o.season}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block mb-1 text-[10.5px]" style={{ color: 'var(--adm-text-3)' }}>Shape</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="adm-input" style={{ height: 32 }}>
                {options.formats.map((f) => (
                  <option key={f.id} value={f.id}>{f.label} · {f.aspect}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="adm-btn adm-btn-primary w-full"
            style={{ height: 32 }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {busy ? 'Generating… about a minute' : 'Generate — 1 credit'}
          </button>
        </div>
      )}

      {note && (
        <p
          className="text-[10.5px] mt-1.5 leading-snug"
          style={{ color: note.tone === 'ok' ? 'var(--adm-ok)' : 'var(--adm-bad)' }}
        >
          {note.text}
        </p>
      )}
      {credits !== null && credits <= 5 && (
        <p className="text-[10.5px] mt-1" style={{ color: 'var(--adm-warn)' }}>
          Running low on credits.
        </p>
      )}
    </div>
  )
}
