import AnnouncementBar from '@/components/AnnouncementBar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getStoreSettings } from '@/lib/settings'

/**
 * Storefront chrome. Everything the customer browses lives in this group.
 * Auth screens sit in (auth) and deliberately render none of this.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // One cached read for the whole storefront chrome, so the banner can never
  // advertise a threshold the checkout won't honour.
  const settings = await getStoreSettings()
  return (
    <>
      <AnnouncementBar freeShippingOver={settings.freeShippingOver} />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
