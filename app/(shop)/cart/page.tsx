import type { Metadata } from 'next'
import CartPage from '@/components/pages/CartPage'
import { getProductsByCategory } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your bag before checkout.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  // Fetched here so the cart, a client component, doesn't query the database.
  // The component filters out anything already in the bag or out of stock.
  const suggestions = await getProductsByCategory('accessories')
  return <CartPage suggestions={suggestions} />
}
