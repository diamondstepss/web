import type { Metadata } from 'next'
import ReportsView from '@/components/admin/views/ReportsView'

export const metadata: Metadata = { title: 'Reports', description: 'Revenue and order analytics.' }

export default function Page() {
  return <ReportsView />
}
