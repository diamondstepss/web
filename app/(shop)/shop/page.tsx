import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopPage from '@/components/pages/ShopPage'
import { getProducts } from '@/lib/catalog'
import { getStoreSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const { freeShippingOver } = await getStoreSettings()
  return {
    title: 'Shop All',
    description: `Every product in stock — sneakers, sports shoes, loafers and accessories. Filter by brand, size, price and discount. Free shipping over ₹${freeShippingOver.toLocaleString('en-IN')}.`,
  }
}

export default async function Page() {
  // Read from Postgres so anything the admin publishes appears here.
  const products = await getProducts()
  return (
    // The filter sidebar reads useSearchParams, which opts its subtree out of
    // prerendering; the boundary keeps the rest of the page static.
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <ShopPage products={products} />
    </Suspense>
  )
}
