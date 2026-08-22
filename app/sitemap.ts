import type { MetadataRoute } from 'next'
import { getProducts, getCategories } from '@/lib/catalog'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'

const CONTENT = [
  { path: '', priority: 1.0, freq: 'daily' as const },
  { path: 'shop', priority: 0.9, freq: 'daily' as const },
  { path: 'about-us', priority: 0.5, freq: 'monthly' as const },
  { path: 'contact', priority: 0.5, freq: 'monthly' as const },
  { path: 'faq', priority: 0.5, freq: 'monthly' as const },
  { path: 'size-guide', priority: 0.6, freq: 'monthly' as const },
  { path: 'order-tracking', priority: 0.4, freq: 'monthly' as const },
  { path: 'shipping-policy', priority: 0.3, freq: 'yearly' as const },
  { path: 'return-policy', priority: 0.3, freq: 'yearly' as const },
  { path: 'terms-and-conditions', priority: 0.2, freq: 'yearly' as const },
  { path: 'privacy-policy-2', priority: 0.2, freq: 'yearly' as const },
  { path: 'data-deletion', priority: 0.1, freq: 'yearly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()])
  const now = new Date()

  return [
    ...CONTENT.map((c) => ({
      url: c.path ? `${BASE}/${c.path}` : BASE,
      lastModified: now,
      changeFrequency: c.freq,
      priority: c.priority,
    })),
    ...categories.map(({ slug }) => ({
      url: `${BASE}/product-category/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${BASE}/product/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
