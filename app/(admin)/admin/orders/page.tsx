import type { Metadata } from 'next'
import OrdersView from '@/components/admin/views/OrdersView'

export const metadata: Metadata = { title: 'Orders', description: 'View and progress customer orders.' }

export default function Page() {
  return <OrdersView />
}
