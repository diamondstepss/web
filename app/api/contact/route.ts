import { NextResponse, type NextRequest } from 'next/server'
import { sendContactMessage, isEmailConfigured } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Contact-form enquiries.
 *
 * The form previously only set a React flag and showed a confirmation, so every
 * message was discarded while the customer believed it had been sent. This
 * route actually delivers it, and reports failure honestly so the UI can too.
 */

/** Crude in-memory throttle. Survives a warm lambda, which is enough to stop
 *  a bored visitor hammering the form; real abuse needs a WAF. */
const recent = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  recent.set(ip, hits)
  return hits.length > MAX_PER_WINDOW
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  if (!isEmailConfigured) {
    console.error('[contact] RESEND_API_KEY is not set — cannot deliver enquiry')
    return NextResponse.json(
      { error: 'Messages are temporarily unavailable. Please call or WhatsApp us instead.' },
      { status: 503 },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again in a few minutes.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: a hidden field only a bot would fill. Answer 200 so it can't tell.
  if (str(body.company, 80)) return NextResponse.json({ ok: true })

  const name = str(body.name, 120)
  const email = str(body.email, 200)
  const phone = str(body.phone, 30)
  const subject = str(body.subject, 160)
  const message = str(body.message, 4000)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Please fill in your name, email and message.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })
  }

  try {
    await sendContactMessage({ name, email, phone, subject, message })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Never swallow this — a silent failure is what made the form useless.
    console.error('[contact] send failed', e)
    return NextResponse.json(
      { error: 'We could not send that just now. Please call or WhatsApp us instead.' },
      { status: 502 },
    )
  }
}
