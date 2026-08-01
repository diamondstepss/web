import type { Metadata } from 'next'
import ProductsView from '@/components/admin/views/ProductsView'

export const metadata: Metadata = { title: 'Products', description: 'Manage the product catalog.' }

export default function Page() {
  return <ProductsView />
}
