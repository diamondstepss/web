import type { Metadata } from 'next'
import SizeGuidePage from '@/components/pages/SizeGuidePage'

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'UK, EU, US and centimetre conversion chart plus how to measure your foot at home.',
}

export default function Page() {
  return <SizeGuidePage />
}
