import { rest, toProduct, getSaleProducts, type DbProduct } from '@/lib/catalog'
import type { Product } from '@/lib/types'

/**
 * Homepage sections, as the storefront should render them.
 *
 * The admin has had a full section builder since 0011 — add a rail, choose
 * where its products come from, reorder, hide, save. None of it did anything.
 * `homepage_sections` was written by the admin and read by nobody: the homepage
 * rendered a hardcoded layout, so every change a shop owner made was silently
 * discarded.
 *
 * This is the read path that makes the builder real.
 */

export type SectionType =
  | 'HERO_SLIDER'
  | 'USP_STRIP'
  | 'PRODUCT_RAIL'
  | 'CATEGORY_TILES'
  | 'VIDEO_HERO'
  | 'BRAND_STRIP'
  | 'SPLIT_BANNER'
  | 'NEWSLETTER'

export type SectionSource = 'FEATURED' | 'COLLECTION' | 'CATEGORY' | 'SALE' | 'NEWEST' | 'MANUAL'

export interface HomeSection {
  id: string
  type: SectionType
  title: string
  subtitle: string | null
  source: SectionSource
  sourceSlug: string | null
  itemLimit: number
  position: number
  /** Resolved for the rail types; empty for the rest. */
  products: Product[]
}

interface Row {
  id: string
  type: SectionType
  title: string
  subtitle: string | null
  source: SectionSource
  source_slug: string | null
  item_limit: number
  position: number
  is_visible: boolean
  starts_at: string | null
  ends_at: string | null
}

/**
 * Sections that should be on screen right now.
 *
 * Scheduling is filtered here rather than in the query so the window is judged
 * against the request, not against whenever the cache was filled. A Diwali rail
 * with an end date must stop showing the moment it passes, not up to a minute
 * later.
 */
export async function getHomeSections(): Promise<HomeSection[]> {
  // Tagged 'catalog' like everything else, so the admin's existing revalidate
  // call clears sections too rather than needing its own.
  const rows = await rest<Row>('homepage_sections?select=*&order=position.asc')

  const now = Date.now()
  const live = rows.filter((r) => {
    if (!r.is_visible) return false
    if (r.starts_at && new Date(r.starts_at).getTime() > now) return false
    if (r.ends_at && new Date(r.ends_at).getTime() < now) return false
    return true
  })

  return Promise.all(live.map(resolve))
}

/** Whether a section type shows a list of products at all. */
export const isProductRail = (t: SectionType) => t === 'PRODUCT_RAIL'

async function resolve(row: Row): Promise<HomeSection> {
  const base: HomeSection = {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    source: row.source,
    sourceSlug: row.source_slug,
    itemLimit: row.item_limit,
    position: row.position,
    products: [],
  }

  if (!isProductRail(row.type)) return base

  return { ...base, products: await productsFor(row) }
}

/**
 * The products behind one rail.
 *
 * Filtered in PostgREST rather than fetched-then-sliced, so a shop with a
 * thousand products does not ship all of them to render a row of eight.
 */
async function productsFor(row: Row): Promise<Product[]> {
  const limit = Math.min(Math.max(row.item_limit, 1), 24)

  switch (row.source) {
    case 'SALE':
      // The only source the database cannot express: "marked down" is a
      // comparison between two columns, which PostgREST will not do.
      return (await getSaleProducts(1)).slice(0, limit)

    case 'NEWEST':
      return (
        await rest<DbProduct>(`products?select=*&is_active=eq.true&order=created_at.desc&limit=${limit}`)
      ).map(toProduct)

    case 'COLLECTION':
      return row.source_slug ? viaJoin('collections', row.source_slug, limit) : []

    case 'CATEGORY':
      return row.source_slug ? viaJoin('categories', row.source_slug, limit) : []

    case 'FEATURED':
    default:
      return (
        await rest<DbProduct>(
          `products?select=*&is_active=eq.true&is_featured=eq.true&order=position.asc&limit=${limit}`,
        )
      ).map(toProduct)
  }
}

/** Products in a collection or category, by slug. */
async function viaJoin(
  table: 'collections' | 'categories',
  slug: string,
  limit: number,
): Promise<Product[]> {
  const joinTable = table === 'collections' ? 'product_collections' : 'product_categories'
  const fk = table === 'collections' ? 'collection_id' : 'category_id'

  const found = await rest<{ id: string }>(`${table}?slug=eq.${encodeURIComponent(slug)}&select=id`)
  const id = found[0]?.id
  if (!id) return []

  const rows = await rest<{ products: DbProduct | null }>(
    `${joinTable}?${fk}=eq.${id}&select=products(*)&limit=${limit}`,
  )

  return rows
    .map((r) => r.products)
    .filter((p): p is DbProduct => Boolean(p?.is_active))
    .map(toProduct)
}
