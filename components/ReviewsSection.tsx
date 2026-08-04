import { Star, ExternalLink } from 'lucide-react'
import { SITE } from '@/data/site'
import { verifiedRating, type Review } from '@/lib/reviews'

/**
 * What customers say about the shop.
 *
 * Google reviews and the shop's own testimonials are labelled differently on
 * purpose. A "Verified" badge on a testimonial the shop wrote itself is a claim
 * it can't support; only a Google review links back somewhere a visitor can
 * check it.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Formats in UTC from fixed parts.
 *
 * toLocaleDateString resolves against the runtime's locale and timezone, so the
 * server and the browser produced different strings and hydration failed. This
 * gives both the same answer.
 */
function monthYear(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? 'var(--warning)' : 'none'}
          color={i <= rating ? 'var(--warning)' : 'var(--text-muted)'}
        />
      ))}
    </span>
  )
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null

  // Averages across every Google review, including the rating-only ones.
  const rating = verifiedRating(reviews)
  // Only reviews with something written can be shown as a card.
  const quotable = reviews.filter((r) => r.body.trim().length > 0)
  if (!quotable.length) return null

  return (
    <section className="section-pad" style={{ background: 'var(--surface)' }}>
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div>
            <h2
              className="text-3xl md:text-[44px] font-black uppercase tracking-tight"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              What customers say
            </h2>
            {/* Only shown when there are real Google reviews to average. */}
            {rating && (
              <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Stars rating={Math.round(rating.average)} />
                <strong style={{ color: 'var(--text-primary)' }}>{rating.average}</strong>
                <span>{`from ${rating.count} Google review${rating.count === 1 ? '' : 's'}`}</span>
              </div>
            )}
          </div>

          <a
            href={SITE.social.maps}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest"
            style={{ color: 'var(--accent)', fontFamily: 'Outfit' }}
          >
            Read us on Google <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {quotable.slice(0, 6).map((r) => (
            <article
              key={r.id}
              className="p-6 flex flex-col"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <Stars rating={r.rating} />
                {r.source === 'GOOGLE' ? (
                  <a
                    href={r.sourceUrl ?? SITE.social.maps}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: 'var(--success)' }}
                    title="Verify this review on Google"
                  >
                    Google review <ExternalLink size={10} />
                  </a>
                ) : (
                  // Honest label: the shop picked this one, so it is not a
                  // verifiable third-party review and must not claim to be.
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Customer testimonial
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>
                {r.body}
              </p>

              <div className="flex items-center gap-2.5 mt-5">
                {r.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.authorPhoto}
                    alt=""
                    className="rounded-full object-cover"
                    style={{ width: 30, height: 30 }}
                  />
                ) : (
                  <span
                    className="flex items-center justify-center text-[12px] font-bold text-white rounded-full"
                    style={{ width: 30, height: 30, background: 'var(--accent)' }}
                    aria-hidden
                  >
                    {r.author.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {r.author}
                  </span>
                  <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {r.location ?? monthYear(r.publishedAt)}
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
