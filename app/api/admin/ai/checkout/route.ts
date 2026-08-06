import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/server/admin-guard'
import { getPacks, startCheckout, AiServiceError } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Buying credits, from inside the shop's own admin.
 *
 * `GET` lists the packs, `POST { packId }` starts a Razorpay order. The shop
 * owner is already signed in here, so there is no second login to sit through —
 * and the service key stays on this server, never in their browser.
 *
 * The browser gets back an order id and Razorpay's publishable key id, which is
 * exactly what Checkout needs and nothing more. Credits are granted by the
 * webhook the service receives, never by anything this page reports.
 */

export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  try {
    return NextResponse.json(await getPacks())
  } catch (e) {
    if (e instanceof AiServiceError) {
      return NextResponse.json({ configured: false, error: e.message }, { status: 200 })
    }
    console.error('[ai/checkout] packs failed', e)
    return NextResponse.json({ configured: false }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  let body: { packId?: unknown }
  try {
    body = (await req.json()) as { packId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const packId = typeof body.packId === 'string' ? body.packId : ''
  if (!packId) return NextResponse.json({ error: 'Choose a pack.' }, { status: 400 })

  try {
    return NextResponse.json(await startCheckout(packId))
  } catch (e) {
    if (e instanceof AiServiceError) {
      return NextResponse.json({ error: e.message, kind: e.kind }, { status: 502 })
    }
    console.error('[ai/checkout] order failed', e)
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
  }
}
