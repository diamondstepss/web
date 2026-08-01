import type { Metadata } from 'next'
import HomePage from '@/components/pages/HomePage'
import { getProducts, getSaleProducts, getCategories } from '@/lib/catalog'

export const metadata: Metadata = {
  description: 'Authentic sneakers, sports shoes, loafers and accessories at honest prices. Free shipping over ₹999, COD available, 7-day easy returns.',
}

export default async function Page() {
  const [products, sale, categories] = await Promise.all([
    getProducts(),
    getSaleProducts(),
    getCategories(),
  ])
  return <HomePage products={products} saleProducts={sale} categories={categories} />
}
