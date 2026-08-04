/**
 * Shop reviews, read from Postgres.
 *
 * Plain fetch rather than supabase-js so Next can cache and revalidate it with
 * the rest of the storefront. Tagged `reviews` so a sync can bust it.
 */

export interface Review {
  id: string
  source: 'GOOGLE' | 'MANUAL'
  author: string
  authorPhoto: string | null
  location: string | null
  rating: number
  body: string
  publishedAt: string
  sourceUrl: string | null
}

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

interface Row {
  id: string
  source: string
  author: string
  author_photo: string | null
  location: string | null
  rating: number
  body: string
  published_at: string
  source_url: string | null
}

export async function getReviews(limit = 50): Promise<Review[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !KEY) return []
  try {
    const res = await fetch(
      `${REST}/reviews?select=*&is_published=eq.true&order=position.asc,published_at.desc&limit=${limit}`,
      {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        next: { revalidate: 300, tags: ['reviews'] },
      },
    )
    if (!res.ok) {
      console.error('[reviews]', res.status, await res.text())
      return []
    }
    const rows = (await res.json()) as Row[]
    return rows.map((r) => ({
      id: r.id,
      source: r.source === 'GOOGLE' ? 'GOOGLE' : 'MANUAL',
      author: r.author,
      authorPhoto: r.author_photo,
      location: r.location,
      rating: r.rating,
      body: r.body,
      publishedAt: r.published_at,
      sourceUrl: r.source_url,
    }))
  } catch (e) {
    console.error('[reviews] fetch failed', e)
    return []
  }
}

/**
 * Aggregate across GOOGLE reviews only.
 *
 * Manual testimonials are chosen by the shop, so averaging them would produce a
 * flattering number that means nothing — and if it ever reached structured data
 * it would be exactly the kind of invented rating Google issues manual actions
 * for. Returns null when there are no Google reviews to average.
 */
export function verifiedRating(reviews: Review[]): { average: number; count: number } | null {
  const google = reviews.filter((r) => r.source === 'GOOGLE')
  if (!google.length) return null
  const sum = google.reduce((t, r) => t + r.rating, 0)
  return { average: Math.round((sum / google.length) * 10) / 10, count: google.length }
}
