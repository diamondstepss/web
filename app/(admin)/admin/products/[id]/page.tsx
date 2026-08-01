import type { Metadata } from 'next'
import ProductFormView from '@/components/admin/views/ProductFormView'

export const metadata: Metadata = {
  title: 'Edit product',
  description: 'Edit a product in the catalog.',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductFormView productId={id} />
}
