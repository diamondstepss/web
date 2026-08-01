import type { Metadata } from 'next'
import ProductFormView from '@/components/admin/views/ProductFormView'

export const metadata: Metadata = {
  title: 'New product',
  description: 'Add a product to the catalog.',
}

export default function Page() {
  return <ProductFormView />
}
