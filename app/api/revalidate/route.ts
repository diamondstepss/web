import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Drops the cached catalog so an admin edit shows on the storefront at once
 * instead of waiting out the 60s ISR window.
 *
 * Admin-only: the caller's session is checked here, and the catalog RLS
 * policies mean a non-admin could not have changed anything anyway.
 */
export async function POST() {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  revalidateTag('catalog', 'max')
  return NextResponse.json({ revalidated: true })
}
