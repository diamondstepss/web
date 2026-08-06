'use client'

import { useState, useRef } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

/**
 * Tells the credit chip in the admin header that the balance moved.
 *
 * A window event rather than context: the chip and this button sit in different
 * trees (shell versus page), and threading a provider through the whole admin
 * to carry one number is more machinery than the number is worth.
 */
export const AI_CREDITS_EVENT = 'ai-credits-changed'

function creditsChanged(credits?: number) {
  window.dispatchEvent(new CustomEvent(AI_CREDITS_EVENT, { detail: { credits } }))
}

/**
 * "Write with AI" for the product description.
 *
 * The button sends only the product id — the server reads brand, prices, sizes
 * and photos from the row itself, so the copy always describes the product that
 * exists rather than whatever is currently unsaved in the form.
 *
 * That is also why it is disabled until the product has been saved once: there
 * is nothing to look at yet, and spending a credit to describe an empty row
 * would be the customer's money wasted.
 */
export default function AiDescriptionButton({
  productId,
  hasExisting,
  onResult,
}: {
  productId?: string
  hasExisting: boolean
  onResult: (text: string) => void
}) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null)

  // Held across retries: the service returns the original result for a key it
  // has already seen, so a retry after a dropped reply is not charged again.
  const idempotencyKey = useRef<string | null>(null)

  const run = async () => {
    if (!productId) return

    if (hasExisting) {
      const ok = await confirm({
        title: 'Replace the description?',
        message: 'The current description will be overwritten. This uses one credit.',
        confirmLabel: 'Replace',
        destructive: false,
      })
      if (!ok) return
    }

    setBusy(true)
    setNote(null)
    idempotencyKey.current ??= crypto.randomUUID()

    try {
      const res = await fetch('/api/admin/ai/description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, idempotencyKey: idempotencyKey.current }),
      })
      const data = (await res.json()) as {
        description?: string
        creditsCharged?: number
        creditsRemaining?: number
        warnings?: string[]
        error?: string
        kind?: string
      }

      if (!res.ok) {
        // Out of credits means the chip is showing a stale number.
        if (res.status === 402) creditsChanged()
        setNote({ text: data.error ?? 'That did not work.', tone: 'bad' })
        return
      }

      onResult(data.description ?? '')
      creditsChanged(data.creditsRemaining)
      // A fresh key next time — this generation is paid for and done.
      idempotencyKey.current = null
      // A warning means the copy contains something the photos do not show.
      // That is the one case where "read it before saving" is not enough.
      const warnings = data.warnings ?? []
      setNote(
        warnings.length > 0
          ? {
              text: `Check before saving — ${warnings.map((w) => `"${w}"`).join(', ')} ${
                warnings.length === 1 ? 'is' : 'are'
              } not visible in the photos.`,
              tone: 'bad',
            }
          : {
              text: `${data.creditsCharged ?? 1} credit used · ${data.creditsRemaining ?? 0} left. Read it before saving.`,
              tone: 'ok',
            },
      )
    } catch {
      setNote({ text: 'Could not reach the server.', tone: 'bad' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy || !productId}
        title={productId ? undefined : 'Save the product first'}
        className="adm-btn adm-btn-ghost text-[11.5px] px-2.5 py-1.5"
      >
        {busy ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Sparkles size={13} />
        )}
        {busy ? 'Writing…' : 'Write with AI'}
      </button>
      {note && (
        <span
          className="text-[10.5px] leading-snug text-right max-w-[260px]"
          style={{ color: note.tone === 'ok' ? 'var(--adm-ok)' : 'var(--adm-bad)' }}
        >
          {note.text}
        </span>
      )}
    </div>
  )
}
