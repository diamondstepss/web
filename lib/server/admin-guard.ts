import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Session check for admin-only API routes.
 *
 * Returns either the admin's user id, or the response to send back. Callers do:
 *
 *     const guard = await requireAdmin()
 *     if ('response' in guard) return guard.response
 *
 * which is harder to get wrong than a boolean — you cannot forget to return,
 * because there is nothing else to do with a NextResponse.
 *
 * `getUser()` rather than `getSession()` on purpose: it verifies the JWT with
 * Supabase instead of trusting whatever the cookie claims.
 */
export async function requireAdmin(): Promise<{ userId: string } | { response: NextResponse }> {
  const supabase = await createClient()
  if (!supabase) {
    return { response: NextResponse.json({ error: 'not configured' }, { status: 500 }) }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.json({ error: 'unauthorised' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) {
    return { response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }

  return { userId: user.id }
}
