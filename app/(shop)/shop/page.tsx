import type { Metadata } from 'next'
import ShopPage from '@/components/pages/ShopPage'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Every product in stock — 14 brands, UK 6 to 11, ₹799 to ₹3,500. Free shipping over ₹999.',
}

export default async function Page() {
  // Read from Postgres so anything the admin publishes appears here.
  const products = await getProducts()
  return <ShopPage products={products} />
}
