'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { AI_CREDITS_EVENT } from './AiDescriptionButton'

interface BalanceResponse {
  configured: boolean
  credits?: number
  lowWater?: number
  topupUrl?: string | null
}

/**
 * Remaining AI credits, in the admin header.
 *
 * Renders nothing at all when the add-on is not connected. An admin who has not
 * bought the add-on should not see a permanent advert for it in their header,
 * and an outage in an optional service should not put a red badge on a screen
 * they use to run the shop.
 *
 * Top-up happens in the add-on's own dashboard, so this only ever links out.
 */
export default function AiCreditsChip() {
  const [state, setState] = useState<BalanceResponse | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai/balance', { cache: 'no-store' })
      if (!res.ok) return setState({ configured: false })
      setState((await res.json()) as BalanceResponse)
    } catch {
      setState({ configured: false })
    }
  }, [])

  useEffect(() => {
    void load()

    const onChange = (e: Event) => {
      const credits = (e as CustomEvent<{ credits?: number }>).detail?.credits
      // The generation already told us the new balance — trust it rather than
      // making a round trip. Only refetch when it didn't.
      if (typeof credits === 'number') {
        setState((prev) => (prev ? { ...prev, credits } : prev))
      } else {
        void load()
      }
    }

    window.addEventListener(AI_CREDITS_EVENT, onChange)
    return () => window.removeEventListener(AI_CREDITS_EVENT, onChange)
  }, [load])

  if (!state?.configured || typeof state.credits !== 'number') return null

  const low = state.credits <= (state.lowWater ?? 5)
  const body = (
    <>
      <Sparkles size={12} />
      <span>
        {state.credits}
        <span className="hidden sm:inline"> credit{state.credits === 1 ? '' : 's'}</span>
      </span>
    </>
  )

  // Only a link when there is somewhere to send them; a chip that looks
  // clickable and does nothing is worse than a chip that doesn't.
  return state.topupUrl ? (
    <a
      href={state.topupUrl}
      target="_blank"
      rel="noreferrer"
      title={low ? 'Running low — top up' : 'AI credits — top up'}
      className={`adm-badge ${low ? 'adm-badge-warn' : 'adm-badge-mute'}`}
      style={{ height: 30, gap: 5 }}
    >
      {body}
    </a>
  ) : (
    <span
      title={low ? 'AI credits running low' : 'AI credits'}
      className={`adm-badge ${low ? 'adm-badge-warn' : 'adm-badge-mute'}`}
      style={{ height: 30, gap: 5 }}
    >
      {body}
    </span>
  )
}
