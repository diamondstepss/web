import type { Metadata } from 'next'
import SectionsView from '@/components/admin/views/SectionsView'

export const metadata: Metadata = { title: 'Sections', description: 'Build and order the homepage sections.' }

export default function Page() {
  return <SectionsView />
}
