import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Sends the welcome email after signup.
 *
 * Two deliberate constraints:
 *
 *  1. **It always sends to the caller's own address**, read from their session
 *     — never to an address in the request body. Otherwise this endpoint would
 *     be a way to send Diamond Stepss-branded mail to anyone.
 *
 *  2. **It sends once**, guarded by `welcomed_at` on the profile. A reload of
 *     the signup page, or a retried request, must not mail the customer twice.
 */
export async function POST() {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'not signed in' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, welcomed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.welcomed_at) {
    return NextResponse.json({ ok: true, alreadySent: true })
  }

  // Claim the send before doing it, so two near-simultaneous requests can't
  // both pass the check above and send twice.
  const { error: claimError } = await admin
    .from('profiles')
    .update({ welcomed_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcomed_at', null)

  if (claimError) {
    console.error('[welcome] could not claim send', claimError)
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    await sendWelcomeEmail({ to: user.email, name: profile?.full_name ?? null })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Release the claim so a later attempt can retry.
    await admin.from('profiles').update({ welcomed_at: null }).eq('id', user.id)
    console.error('[welcome] send failed', e)
    return NextResponse.json({ error: 'could not send' }, { status: 502 })
  }
}
