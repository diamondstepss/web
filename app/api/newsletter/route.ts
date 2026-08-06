import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletterWelcome } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Newsletter signup.
 *
 * The footer previously showed `alert('Thanks for subscribing!')` and stored
 * nothing, so every address was lost. This persists it.
 *
 * Uses the service role because the subscribers table is deliberately not
 * readable or writable by the anon key — otherwise anyone could enumerate the
 * mailing list.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[newsletter] Supabase service role is not configured')
    return NextResponse.json({ error: 'Signups are temporarily unavailable.' }, { status: 503 })
  }

  let body: { email?: unknown; source?: unknown }
  try {
    body = (await req.json()) as { email?: unknown; source?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : ''
  const source = typeof body.source === 'string' ? body.source.slice(0, 40) : 'footer'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })

  const { error } = await admin
    .from('newsletter_subscribers')
    .insert({ email, source })

  if (error) {
    // 23505 = unique violation. Already subscribed is a success from the
    // visitor's point of view, and confirming it leaks nothing they didn't
    // already type in.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }
    console.error('[newsletter] insert failed', error)
    return NextResponse.json({ error: 'We could not sign you up just now.' }, { status: 502 })
  }

  // Confirm the signup. A failed email must not fail the subscription — the
  // address is already saved, and telling them it went wrong would be untrue.
  try {
    await sendNewsletterWelcome({ to: email })
  } catch (e) {
    console.error('[newsletter] welcome email failed', e)
  }

  return NextResponse.json({ ok: true })
}
