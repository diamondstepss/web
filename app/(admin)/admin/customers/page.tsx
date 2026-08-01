import type { Metadata } from 'next'
import CustomersView from '@/components/admin/views/CustomersView'

export const metadata: Metadata = { title: 'Customers', description: 'Registered customer accounts.' }

export default function Page() {
  return <CustomersView />
}
