import type { Metadata } from 'next'
import DataDeletionPage from '@/components/pages/DataDeletionPage'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions',
  description: 'How to request deletion of your Diamond Stepss account and data, including via Google or Facebook sign-in.',
}

export default function Page() {
  return <DataDeletionPage />
}
