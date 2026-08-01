import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import '@/app/admin.css'

/**
 * Chrome for every /admin route. Because it's a layout, the sidebar mounts once
 * and survives navigation between sections — only the panel below it swaps.
 */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · Diamond Stepss' },
  robots: { index: false, follow: false },
}

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
