import type { Metadata } from 'next'
import CheckoutPage from '@/components/pages/CheckoutPage'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Secure checkout with UPI, cards, net banking, COD and partial COD.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CheckoutPage />
}
