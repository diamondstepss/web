import type { Product } from './types'

/**
 * Catalog reads.
 *
 * The tables are world-readable (RLS `using (true)`), so the storefront can
 * fetch them from a server component without a session. Writes are admin-only
 * and live in `lib/catalog-admin.ts`.
 */

export interface DbProduct {
  id: string
  slug: string
  brand: string
  title: string
  description: string | null
  price: number
  mrp: number
  image: string | null
  sizes: string[]
  stock: number
  badge: string | null
  is_featured: boolean
  is_active: boolean
  position: number
}

export interface DbCategory {
  id: string
  slug: string
  name: string
  image: string | null
  position: number
  is_active: boolean
}

/** Maps a row to the shape the existing product components already expect. */
export function toProduct(row: DbProduct): Product {
  const price = Number(row.price)
  const mrp = Number(row.mrp)
  return {
    id: row.slug, // slug is the public identifier — it's what /product/[slug] uses
    brand: row.brand,
    title: row.title,
    price,
    mrp,
    discount: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    image: row.image ?? '',
    badge: (row.badge as Product['badge']) ?? null,
    sizes: row.sizes.map(Number).filter((n) => !Number.isNaN(n)),
    isNew: row.badge === 'NEW',
  }
}

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Plain fetch rather than supabase-js so Next can cache and revalidate it.
 * `revalidate: 60` keeps catalog pages static but never more than a minute
 * stale — an admin edit shows up without a rebuild.
 */
async function rest<T>(path: string, revalidate = 60): Promise<T[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !KEY) return []
  try {
    const res = await fetch(`${REST}/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      next: { revalidate, tags: ['catalog'] },
    })
    if (!res.ok) {
      console.error('[catalog]', path, res.status, await res.text())
      return []
    }
    return (await res.json()) as T[]
  } catch (e) {
    console.error('[catalog] fetch failed', e)
    return []
  }
}

export async function getProducts(): Promise<Product[]> {
  const rows = await rest<DbProduct>('products?is_active=eq.true&order=position.asc')
  return rows.map(toProduct)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await rest<DbProduct>(
    'products?is_active=eq.true&is_featured=eq.true&order=position.asc',
  )
  return rows.map(toProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await rest<DbProduct>(`products?slug=eq.${encodeURIComponent(slug)}&limit=1`)
  return rows[0] ? toProduct(rows[0]) : null
}

export async function getCategories(): Promise<DbCategory[]> {
  return rest<DbCategory>('categories?is_active=eq.true&order=position.asc')
}

/** Products in one category, resolved through the join table. */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const rows = await rest<{ products: DbProduct }>(
    `product_categories?select=products(*)&category_id=in.(select id from categories where slug=eq.${slug})`,
  )
  // PostgREST cannot take a subquery inline, so resolve the category first.
  if (rows.length) return rows.map((r) => toProduct(r.products))

  const cats = await rest<DbCategory>(`categories?slug=eq.${encodeURIComponent(slug)}&limit=1`)
  if (!cats[0]) return []
  const links = await rest<{ products: DbProduct }>(
    `product_categories?select=products(*)&category_id=eq.${cats[0].id}`,
  )
  return links
    .map((l) => l.products)
    .filter((p) => p?.is_active)
    .map(toProduct)
}

/** Deepest discounts, for the sale rail. */
export async function getSaleProducts(minDiscount = 29): Promise<Product[]> {
  const all = await getProducts()
  return all.filter((p) => p.discount >= minDiscount)
}

export interface MediaSlide {
  type: 'IMAGE' | 'YOUTUBE'
  url: string
  /** For YouTube slides this is the poster image used by the lite facade. */
  poster: string | null
}

/** Gallery slides for a product, ordered. Falls back to the main image. */
export async function getProductGallery(slug: string): Promise<MediaSlide[]> {
  const products = await rest<{ id: string; image: string | null }>(
    `products?slug=eq.${encodeURIComponent(slug)}&select=id,image&limit=1`,
  )
  const product = products[0]
  if (!product) return []

  const rows = await rest<{ type: string; url: string; alt: string | null }>(
    `product_media?product_id=eq.${product.id}&order=position.asc`,
  )

  if (!rows.length) {
    return product.image ? [{ type: 'IMAGE', url: product.image, poster: null }] : []
  }

  return rows.map((r) => ({
    type: r.type === 'YOUTUBE' ? 'YOUTUBE' : 'IMAGE',
    url: r.url,
    poster: r.type === 'YOUTUBE' ? r.alt : null,
  }))
}
