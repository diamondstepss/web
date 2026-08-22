import type { Metadata } from 'next'
import PrivacyPolicyPage from '@/components/pages/PrivacyPolicyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What data we collect, who we share it with, and your rights.',
}

export default function Page() {
  return <PrivacyPolicyPage />
}
