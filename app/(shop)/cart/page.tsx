import type { Metadata } from 'next'
import CartPage from '@/components/pages/CartPage'
import { getProductsByCategory } from '@/lib/catalog'
import { getStoreSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your bag before checkout.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  // Fetched here so the cart, a client component, doesn't query the database.
  const [suggestions, settings] = await Promise.all([
    getProductsByCategory('accessories'),
    getStoreSettings(),
  ])
  return <CartPage suggestions={suggestions} settings={settings} />
}
