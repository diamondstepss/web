import type { Metadata } from 'next'
import WishlistPage from '@/components/pages/WishlistPage'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Products you saved for later.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const products = await getProducts()
  return <WishlistPage products={products} />
}
