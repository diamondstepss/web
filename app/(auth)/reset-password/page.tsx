import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordPage from '@/components/pages/ResetPasswordPage'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your Diamond Stepss account.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <ResetPasswordPage />
    </Suspense>
  )
}
