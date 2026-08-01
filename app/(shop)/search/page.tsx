import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchPage from '@/components/pages/SearchPage'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search sneakers, sports shoes, loafers and accessories at Diamond Stepss.',
}

export default async function Page() {
  const products = await getProducts()
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <SearchPage products={products} />
    </Suspense>
  )
}
