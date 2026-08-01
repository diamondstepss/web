import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Account and funnel pages carry no search value and can leak
        // parameterised duplicates into the index.
        disallow: ['/api/', '/admin', '/my-account', '/wishlist', '/cart', '/checkout', '/login'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
