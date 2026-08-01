import type { Metadata } from 'next'
import ShippingView from '@/components/admin/views/ShippingView'

export const metadata: Metadata = { title: 'Shipping', description: 'Shipping fees, COD limits and prepaid discount.' }

export default function Page() {
  return <ShippingView />
}
