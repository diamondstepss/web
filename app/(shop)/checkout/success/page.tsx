import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderSuccessPage from '@/components/pages/OrderSuccessPage'

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <OrderSuccessPage />
    </Suspense>
  )
}
