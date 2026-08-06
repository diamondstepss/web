import { revalidateTag, revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Drops the cached storefront so an admin edit shows up at once rather than
 * waiting out the 60s ISR window.
 *
 * Three calls, not one, because they clear different things:
 *
 *  - `revalidateTag('catalog')` expires the product, category, collection and
 *    section fetches.
 *  - `revalidateTag('settings')` expires the store settings — shipping
 *    threshold, COD limits, the prepaid discount.
 *  - `revalidatePath('/', 'layout')` expires the *rendered pages* under the
 *    root layout.
 *
 * The last one is the one that was missing. With only the tag, the next visitor
 * still received the previously rendered HTML while Next regenerated behind it
 * — stale-while-revalidate doing exactly what it is designed to do. Right for a
 * CDN, wrong for a shop owner who has just hidden a section and immediately
 * opens the storefront to check. Measured before the fix: one request stale,
 * correct from the second.
 *
 * Admin-only. The RLS policies mean a non-admin could not have changed anything
 * worth publishing, but there is no reason to let anyone flush the cache on
 * demand either.
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
  revalidateTag('settings', 'max')
  revalidatePath('/', 'layout')

  return NextResponse.json({ revalidated: true })
}
