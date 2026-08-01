import type { Metadata } from 'next'
import AccountPage from '@/components/pages/AccountPage'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Track orders, manage addresses and update your profile.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const products = await getProducts()
  return <AccountPage products={products} />
}
