import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPage from '@/components/pages/LoginPage'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Diamond Stepss with a one-time code sent to your email.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <LoginPage />
    </Suspense>
  )
}
