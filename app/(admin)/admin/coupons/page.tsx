import type { Metadata } from 'next'
import CouponsView from '@/components/admin/views/CouponsView'

export const metadata: Metadata = { title: 'Coupons', description: 'Discount codes and their usage.' }

export default function Page() {
  return <CouponsView />
}
