import type { Metadata } from 'next'
import FAQPage from '@/components/pages/FAQPage'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers on payment, COD, delivery times, sizing, returns and authenticity.',
}

export default function Page() {
  return <FAQPage />
}
