import type { Metadata } from 'next'
import { Suspense } from 'react'
import CategoryPage from '@/components/pages/CategoryPage'
import { getProductsByCategory, getProducts } from '@/lib/catalog'
import { SITE } from '@/data/site'
import { itemListJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'

/**
 * Catch-all so the inherited WooCommerce nesting keeps working:
 *   /product-category/sneakers/
 *   /product-category/men/sneakers/
 */
const LABELS: Record<string, string> = {
  sneakers: 'Sneakers',
  sports: 'Sports Shoes',
  'sports-shoes': 'Sports Shoes',
  running: 'Running Shoes',
  'running-shoes': 'Running Shoes',
  loafers: 'Loafers',
  'chelsea-boot': 'Chelsea Boots',
  'chelsea-boots': 'Chelsea Boots',
  leather: 'Leather Shoes',
  'leather-shoes': 'Leather Shoes',
  slippers: 'Slippers',
  accessories: 'Accessories',
  sale: 'Sale',
  'new-arrivals': 'New Arrivals',
  formal: 'Formal Shoes',
}

function labelFor(slug: string[]) {
  const last = slug[slug.length - 1] ?? ''
  return LABELS[last] ?? last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const label = labelFor(slug)
  return {
    title: `${label} — Buy Online`,
    description: `Shop ${label} at Diamond Stepss. 14 brands, UK 6 to 11, free shipping over ₹${SITE.freeShippingOver}, COD available across India.`,
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const leaf = slug[slug.length - 1] ?? ''
  // Fall back to the full catalog for virtual categories like /sale or /new-arrivals.
  const scoped = await getProductsByCategory(leaf)
  const products = scoped.length ? scoped : await getProducts()
  const label = labelFor(slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(products, label)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              { name: label, path: `/product-category/${slug.join('/')}` },
            ]),
          ),
        }}
      />
      {/* The filter sidebar reads useSearchParams, which opts its subtree out
          of prerendering; the boundary keeps the rest of the page static. */}
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <CategoryPage products={products} />
      </Suspense>
    </>
  )
}
