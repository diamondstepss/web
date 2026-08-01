import AnnouncementBar from '@/components/AnnouncementBar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

/**
 * Storefront chrome. Everything the customer browses lives in this group.
 * Auth screens sit in (auth) and deliberately render none of this.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
