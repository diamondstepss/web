import type { Metadata } from 'next'
import ContactPage from '@/components/pages/ContactPage'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Call, WhatsApp, email or visit our Jalandhar store. Monday to Saturday, 10 AM to 7 PM.',
}

export default function Page() {
  return <ContactPage />
}
