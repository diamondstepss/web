import type { Metadata } from 'next'
import CollectionsView from '@/components/admin/views/CollectionsView'

export const metadata: Metadata = { title: 'Collections', description: 'Curated groups that feed the homepage rails.' }

export default function Page() {
  return <CollectionsView />
}
