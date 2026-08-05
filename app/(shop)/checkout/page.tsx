import type { Metadata } from 'next'
import CheckoutPage from '@/components/pages/CheckoutPage'
import { getStoreSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Secure checkout with UPI, cards, net banking, COD and partial COD.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const settings = await getStoreSettings()
  return <CheckoutPage settings={settings} />
}
