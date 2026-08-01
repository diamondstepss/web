import type { Metadata } from 'next'
import ReturnsPolicyPage from '@/components/pages/ReturnsPolicyPage'

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: '7-day returns, free size exchanges, and how refunds are processed.',
}

export default function Page() {
  return <ReturnsPolicyPage />
}
