import type { Metadata } from 'next'
import CartPage from '@/components/pages/CartPage'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your bag before checkout.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CartPage />
}
