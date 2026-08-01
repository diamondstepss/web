import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DashboardView from '@/components/admin/views/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Store administration.',
}

/** Every section used to be /admin?tab=x — keep those links and bookmarks working. */
const LEGACY_TABS = new Set([
  'products', 'categories', 'collections', 'sections', 'media',
  'orders', 'customers', 'coupons', 'shipping', 'reports', 'settings',
])

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  if (tab && LEGACY_TABS.has(tab)) redirect(`/admin/${tab}`)

  return <DashboardView />
}
