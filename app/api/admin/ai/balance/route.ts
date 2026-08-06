import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/admin-guard'
import { getBalance, AiServiceError, isAiConfigured, TOPUP_URL } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Credit balance for the admin header.
 *
 * An unconfigured or unreachable service is not an error here — the add-on is
 * optional, and the admin must keep working without it. The UI hides the chip
 * rather than showing a red banner about a feature nobody bought.
 */
export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  if (!isAiConfigured) {
    return NextResponse.json({ configured: false })
  }

  try {
    const balance = await getBalance()
    return NextResponse.json({ configured: true, ...balance, topupUrl: TOPUP_URL })
  } catch (e) {
    if (e instanceof AiServiceError) {
      return NextResponse.json({ configured: false, error: e.message })
    }
    console.error('[ai/balance] unexpected', e)
    return NextResponse.json({ configured: false })
  }
}
