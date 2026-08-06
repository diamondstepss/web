import type { Metadata } from 'next'
import WishlistPage from '@/components/pages/WishlistPage'
import { getProducts } from '@/lib/catalog'
import { getStoreSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Products you saved for later.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const [products, settings] = await Promise.all([getProducts(), getStoreSettings()])
  return <WishlistPage products={products} settings={settings} />
}
