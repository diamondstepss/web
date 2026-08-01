import type { Metadata } from 'next'
import AboutPage from '@/components/pages/AboutPage'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'From a single shop on Ladhewali Road, Jalandhar to doorsteps across India since 2018.',
}

export default function Page() {
  return <AboutPage />
}
