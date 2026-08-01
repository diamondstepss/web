import type { Metadata } from 'next'
import CategoriesView from '@/components/admin/views/CategoriesView'

export const metadata: Metadata = { title: 'Categories', description: 'Manage product categories.' }

export default function Page() {
  return <CategoriesView />
}
