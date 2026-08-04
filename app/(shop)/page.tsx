import type { Metadata } from 'next'
import HomePage from '@/components/pages/HomePage'
import ReviewsSection from '@/components/ReviewsSection'
import { getProducts, getSaleProducts, getCategories } from '@/lib/catalog'
import { getReviews } from '@/lib/reviews'

export const metadata: Metadata = {
  description: 'Authentic sneakers, sports shoes, loafers and accessories at honest prices. Free shipping over ₹999, COD available, 7-day easy returns.',
}

export default async function Page() {
  const [products, sale, categories, reviews] = await Promise.all([
    getProducts(),
    getSaleProducts(),
    getCategories(),
    getReviews(),
  ])
  return (
    <HomePage
      products={products}
      saleProducts={sale}
      categories={categories}
      // Rendered here rather than inside HomePage so the reviews query stays on
      // the server — HomePage is a client component.
      reviewsSlot={<ReviewsSection reviews={reviews} />}
    />
  )
}
