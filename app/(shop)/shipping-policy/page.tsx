import type { Metadata } from 'next'
import ShippingPolicyPage from '@/components/pages/ShippingPolicyPage'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Delivery times, charges, free shipping over ₹999, COD and partial COD terms.',
}

export default function Page() {
  return <ShippingPolicyPage />
}
