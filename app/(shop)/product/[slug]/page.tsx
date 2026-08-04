import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProducts, getProductBySlug, getProductGallery } from '@/lib/catalog'
import { SITE } from '@/data/site'
import { productJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'
import ProductPage from '@/components/pages/ProductPage'

/** Pre-render every product at build time — this is the "instant loading" bit. */
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ slug: p.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }

  return {
    title: `${product.brand} ${product.title}`,
    description: `Buy ${product.brand} ${product.title} at ₹${product.price} (MRP ₹${product.mrp}). 100% genuine, free shipping over ₹${SITE.freeShippingOver}, COD available.`,
    openGraph: { images: [product.image] },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const gallery = await getProductGallery(slug)
  const all = await getProducts()
  const related = all.filter((p) => p.id !== product.id).slice(0, 6)

  const category = product.categories?.[0]

  return (
    <>
      {/* Real availability, return policy and shipping — no rating, because the
          per-product review counts on this page are placeholder content. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product, category)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              ...(category
                ? [{ name: category.replace(/-/g, ' '), path: `/product-category/${category}` }]
                : [{ name: 'Shop', path: '/shop' }]),
              { name: `${product.brand} ${product.title}`, path: `/product/${product.id}` },
            ]),
          ),
        }}
      />
      <ProductPage product={product} related={related} gallery={gallery} />
    </>
  )
}
