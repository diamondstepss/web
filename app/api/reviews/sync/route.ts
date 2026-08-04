import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { syncGoogleReviews, isGoogleReviewsConfigured } from '@/lib/server/google-reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Pulls the latest Google reviews into the database.
 *
 * Admin-only, and deliberately manual rather than on a page view: the Places
 * API is billed per request, so an unauthenticated endpoint would be a way to
 * run up a bill. Point a cron at it with the admin session if you want it
 * refreshed on a schedule.
 */
export async function POST(_req: NextRequest) {
  if (!isGoogleReviewsConfigured) {
    return NextResponse.json(
      {
        error:
          'Google reviews are not configured. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID, then restart.',
      },
      { status: 503 },
    )
  }

  // Must be a signed-in admin.
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

  try {
    const result = await syncGoogleReviews()
    revalidateTag('reviews', 'max')
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[reviews/sync] failed', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sync failed.' },
      { status: 502 },
    )
  }
}
