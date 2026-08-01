import type { Metadata } from 'next'
import MediaView from '@/components/admin/views/MediaView'

export const metadata: Metadata = { title: 'Media', description: 'All product images and video slides.' }

export default function Page() {
  return <MediaView />
}
