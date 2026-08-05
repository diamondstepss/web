import type { Metadata } from 'next'
import ShippingPolicyPage from '@/components/pages/ShippingPolicyPage'
import { getStoreSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Delivery times, shipping charges, free-shipping threshold, COD and partial COD terms.',
}

export default async function Page() {
  const settings = await getStoreSettings()
  return <ShippingPolicyPage settings={settings} />
}
