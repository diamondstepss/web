import type { Metadata } from 'next'
import TermsPage from '@/components/pages/TermsPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you shop at Diamond Stepss.',
}

export default function Page() {
  return <TermsPage />
}
