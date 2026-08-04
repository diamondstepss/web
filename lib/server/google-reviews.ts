import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Google reviews for the shop's own listing, via the Places API.
 *
 * Why not the Business Profile API: that needs OAuth against the account that
 * owns the listing plus Google's approval, and returns every review. Places is
 * a plain API key and returns the five Google itself considers most relevant —
 * enough for a storefront, and far simpler to keep running.
 *
 * Why cache in Postgres rather than call Google per page view: Places is billed
 * per request, the storefront is statically generated, and Google's terms don't
 * allow holding review content indefinitely — so rows are refreshed on sync and
 * the sync is the only thing that talks to Google.
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places'

export const isGoogleReviewsConfigured = Boolean(
  process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID,
)

interface PlacesReview {
  name?: string
  rating?: number
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string; photoUri?: string; uri?: string }
  publishTime?: string
}

interface PlacesResponse {
  rating?: number
  userRatingCount?: number
  reviews?: PlacesReview[]
  googleMapsUri?: string
}

export interface SyncResult {
  fetched: number
  written: number
  supersededImports: number
  averageRating: number | null
  totalRatings: number | null
}

/**
 * Drops hand-imported rows that the API has now returned for real.
 *
 * Reviews transcribed from the listing carry an `import:` source_id; the API
 * uses Google's own resource names. Without this, the first sync would show
 * every overlapping review twice — once from each source. Matching on author is
 * enough because a person appears at most once on a listing.
 */
async function removeSupersededImports(
  admin: SupabaseClient,
  authors: string[],
): Promise<number> {
  if (!authors.length) return 0
  const { data, error } = await admin
    .from('reviews')
    .delete()
    .eq('source', 'GOOGLE')
    .like('source_id', 'import:%')
    .in('author', authors)
    .select('id')
  if (error) {
    console.error('[reviews] could not clear superseded imports', error)
    return 0
  }
  return data?.length ?? 0
}

/**
 * Pulls the latest reviews from Google and upserts them.
 *
 * Upsert on (source, source_id) so a re-sync updates existing rows instead of
 * duplicating them, and an edited review picks up its new text.
 */
export async function syncGoogleReviews(): Promise<SyncResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!key || !placeId) {
    throw new Error('GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID must both be set.')
  }

  const res = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': key,
      // Field mask is mandatory on Places v1, and keeps the call in the cheaper
      // billing tier by asking only for what we render.
      'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Google Places returned ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }

  const body = (await res.json()) as PlacesResponse
  const reviews = body.reviews ?? []

  const rows = reviews
    .map((r) => {
      const text = r.text?.text ?? r.originalText?.text ?? ''
      const author = r.authorAttribution?.displayName ?? ''
      if (!text.trim() || !author.trim() || !r.rating) return null
      return {
        source: 'GOOGLE' as const,
        // Places review resource names are stable per review.
        source_id: r.name ?? `${author}-${r.publishTime ?? ''}`,
        author,
        author_photo: r.authorAttribution?.photoUri ?? null,
        location: null,
        rating: Math.round(r.rating),
        body: text.trim().slice(0, 2000),
        published_at: r.publishTime ?? new Date().toISOString(),
        source_url: r.authorAttribution?.uri ?? body.googleMapsUri ?? null,
        is_published: true,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  let written = 0
  let supersededImports = 0
  if (rows.length) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    const { error } = await admin.from('reviews').upsert(rows, { onConflict: 'source,source_id' })
    if (error) throw new Error(`Could not save reviews: ${error.message}`)
    written = rows.length
    supersededImports = await removeSupersededImports(admin, rows.map((r) => r.author))
  }

  return {
    fetched: reviews.length,
    written,
    supersededImports,
    averageRating: body.rating ?? null,
    totalRatings: body.userRatingCount ?? null,
  }
}
