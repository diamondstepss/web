import type { Metadata } from 'next'
import TrackPage from '@/components/pages/TrackPage'

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Track your Diamond Stepss shipment with your order number and mobile number.',
}

export default function Page() {
  return <TrackPage />
}
