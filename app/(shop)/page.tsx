import type { Metadata } from 'next'
import HomePage from '@/components/pages/HomePage'
import ReviewsSection from '@/components/ReviewsSection'
import { getProducts, getSaleProducts, getCategories } from '@/lib/catalog'
import { getReviews } from '@/lib/reviews'
import { getStoreSettings } from '@/lib/settings'
import { getHomeSections } from '@/lib/sections'

export async function generateMetadata(): Promise<Metadata> {
  const { freeShippingOver } = await getStoreSettings()
  return {
    description: `Authentic sneakers, sports shoes, loafers and accessories at honest prices. Free shipping over ₹${freeShippingOver.toLocaleString('en-IN')}, COD available, 7-day easy returns.`,
  }
}

export default async function Page() {
  const [products, sale, categories, reviews, settings, sections] = await Promise.all([
    getProducts(),
    getSaleProducts(),
    getCategories(),
    getReviews(),
    getStoreSettings(),
    getHomeSections(),
  ])
  return (
    <HomePage
      products={products}
      saleProducts={sale}
      categories={categories}
      settings={settings}
      sections={sections}
      // Rendered here rather than inside HomePage so the reviews query stays on
      // the server — HomePage is a client component.
      reviewsSlot={<ReviewsSection reviews={reviews} />}
    />
  )
}
