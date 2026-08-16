'use client'

import { db } from './supabase/client'
import { deleteProductFiles } from './media'
import type { DbProduct, DbCategory } from './catalog'

/**
 * Catalog writes. Admin-only — enforced by the RLS policies in migration 0005,
 * not by this file. A non-admin calling these gets a permission error from
 * Postgres rather than a silent no-op.
 */

/** Storefront pages cache the catalog for 60s; a write should show up now. */
/**
 * Clears the storefront cache after an admin change.
 *
 * Not called by the coupon functions, deliberately: coupon codes are read
 * uncached at checkout by lib/server/pricing.ts, so a new code works the moment
 * it is saved and there is nothing to purge.
 */
async function revalidateCatalog() {
  try {
    await fetch('/api/revalidate', { method: 'POST' })
  } catch {
    /* non-fatal — the ISR window still expires on its own */
  }
}

export type ProductInput = {
  slug: string
  brand: string
  title: string
  description?: string | null
  price: number
  mrp: number
  image?: string | null
  sizes?: string[]
  stock?: number
  badge?: string | null
  is_featured?: boolean
  is_active?: boolean
}

export type ProductSort =
  | 'position'
  | 'newest'
  | 'oldest'
  | 'updated'
  | 'price_desc'
  | 'price_asc'
  | 'stock_asc'
  | 'name'

/** column, ascending — one place mapping a sort key to what the database is
 *  actually told, so the dropdown and the query can never disagree. */
const SORT_MAP: Record<ProductSort, [string, boolean]> = {
  position: ['position', true],
  newest: ['created_at', false],
  oldest: ['created_at', true],
  updated: ['updated_at', false],
  price_desc: ['price', false],
  price_asc: ['price', true],
  stock_asc: ['stock', true],
  name: ['title', true],
}

export interface ProductListFilters {
  search?: string
  brand?: string
  categorySlug?: string
  status?: 'LIVE' | 'DRAFT'
  featured?: boolean
  stock?: 'IN' | 'LOW' | 'OUT'
  sort?: ProductSort
  page: number // 1-based
  perPage: number
}

export interface ProductListResult {
  rows: DbProduct[]
  total: number
}

/**
 * Admin view includes inactive products, which the storefront never sees.
 * Filtered, sorted and paged entirely in Postgres — the previous version
 * fetched every product and did all of this in the browser, which was fine
 * at fifteen products and would not stay fine.
 *
 * The category filter is the one filter that needs an inner join rather
 * than a plain embed: `product_categories(categories(slug))` returns every
 * product with its categories attached, but says nothing about which
 * *products* to exclude. `!inner` turns the embed into a real join, so
 * `.eq('product_categories.categories.slug', x)` actually drops rows.
 */
export async function adminFetchProducts(filters: ProductListFilters): Promise<ProductListResult> {
  const { search, brand, categorySlug, status, featured, stock, sort = 'position', page, perPage } = filters

  let query = db()
    .from('products')
    .select(
      categorySlug ? '*,product_categories!inner(categories!inner(slug))' : '*,product_categories(categories(slug))',
      { count: 'exact' },
    )

  const needle = search?.trim().replace(/[%,]/g, '')
  if (needle) query = query.or(`title.ilike.%${needle}%,brand.ilike.%${needle}%,slug.ilike.%${needle}%`)
  if (brand) query = query.eq('brand', brand)
  if (categorySlug) query = query.eq('product_categories.categories.slug', categorySlug)
  if (status) query = query.eq('is_active', status === 'LIVE')
  if (featured !== undefined) query = query.eq('is_featured', featured)
  if (stock === 'OUT') query = query.eq('stock', 0)
  else if (stock === 'LOW') query = query.gt('stock', 0).lt('stock', 5)
  else if (stock === 'IN') query = query.gte('stock', 5)

  const [column, ascending] = SORT_MAP[sort]
  query = query.order(column, { ascending })

  const from = (Math.max(1, page) - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { rows: (data ?? []) as DbProduct[], total: count ?? 0 }
}

/** Every brand in use, for the filter dropdown — independent of whatever
 *  page or filters are currently applied. One narrow column, cheap even
 *  across a large catalog. */
export async function adminFetchBrands(): Promise<string[]> {
  const { data, error } = await db().from('products').select('brand')
  if (error) throw error
  return [...new Set((data ?? []).map((r) => r.brand as string))].sort()
}

/** Whole-catalog counts for the page header and the out-of-stock banner —
 *  these describe the catalog, not the current filtered page, so they're
 *  fetched separately rather than derived from whatever rows happen to be
 *  on screen. `head: true` means Postgres counts without sending the rows. */
export async function adminFetchProductStats(): Promise<{ total: number; live: number; outOfStock: number }> {
  const [totalRes, liveRes, outRes] = await Promise.all([
    db().from('products').select('id', { count: 'exact', head: true }),
    db().from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db().from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
  ])
  if (totalRes.error) throw totalRes.error
  if (liveRes.error) throw liveRes.error
  if (outRes.error) throw outRes.error
  return { total: totalRes.count ?? 0, live: liveRes.count ?? 0, outOfStock: outRes.count ?? 0 }
}

/** One product by id — the edit route loads straight from the URL. */
export async function adminFetchProduct(id: string): Promise<DbProduct | null> {
  const { data, error } = await db().from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as DbProduct) ?? null
}

export async function adminFetchCategories(): Promise<DbCategory[]> {
  const { data, error } = await db().from('categories').select('*').order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as DbCategory[]
}

export async function createProduct(input: ProductInput): Promise<DbProduct> {
  const { data, error } = await db().from('products').insert(input).select().single()
  if (error) throw error
  await revalidateCatalog()
  return data as DbProduct
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<DbProduct> {
  const { data, error } = await db().from('products').update(patch).eq('id', id).select().single()
  if (error) throw error
  await revalidateCatalog()
  return data as DbProduct
}

export interface SizeStockRow {
  size: string
  stock: number
}

/** Per-size stock for a footwear product. Empty for an accessory. */
export async function fetchSizeStock(productId: string): Promise<SizeStockRow[]> {
  const { data, error } = await db()
    .from('product_size_stock')
    .select('size, stock')
    .eq('product_id', productId)
  if (error) throw error
  return (data ?? []) as SizeStockRow[]
}

/**
 * Replaces a product's per-size stock wholesale. A delete-then-insert rather
 * than diffing old rows against new ones — simpler, and it can't leave a
 * removed size's row behind the way a partial update could.
 *
 * `products.stock` is not touched here — the database trigger from migration
 * 0018 recomputes it from these rows the moment they change.
 */
export async function saveSizeStock(productId: string, rows: SizeStockRow[]): Promise<void> {
  const { error: delErr } = await db().from('product_size_stock').delete().eq('product_id', productId)
  if (delErr) throw delErr
  if (!rows.length) return

  const { error: insErr } = await db()
    .from('product_size_stock')
    .insert(rows.map((r) => ({ product_id: productId, size: r.size, stock: r.stock })))
  if (insErr) throw insErr
}

export async function deleteProduct(id: string): Promise<void> {
  // Storage first: after the row is gone there is no record of what was
  // uploaded, and the files would sit in the bucket forever.
  await deleteProductFiles(id)

  const { error } = await db().from('products').delete().eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

/** Featured drives the homepage rails, so it's a one-tap toggle in the list. */
export async function toggleFeatured(id: string, next: boolean): Promise<void> {
  const { error } = await db().from('products').update({ is_featured: next }).eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

export async function toggleActive(id: string, next: boolean): Promise<void> {
  const { error } = await db().from('products').update({ is_active: next }).eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

/**
 * Bulk variants for the Products table's selection toolbar — one query and
 * one revalidation per action instead of one per product, so selecting 50
 * rows doesn't fire 50 round trips.
 */
export async function deleteProductMany(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteProductFiles(id)))
  const { error } = await db().from('products').delete().in('id', ids)
  if (error) throw error
  await revalidateCatalog()
}

export async function toggleFeaturedMany(ids: string[], next: boolean): Promise<void> {
  const { error } = await db().from('products').update({ is_featured: next }).in('id', ids)
  if (error) throw error
  await revalidateCatalog()
}

export async function toggleActiveMany(ids: string[], next: boolean): Promise<void> {
  const { error } = await db().from('products').update({ is_active: next }).in('id', ids)
  if (error) throw error
  await revalidateCatalog()
}

/** Turns "Air Max 90 White" into "air-max-90-white". */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// ── Categories ──────────────────────────────────────────────────────────────

export type CategoryInput = {
  slug: string
  name: string
  image?: string | null
  position?: number
  is_active?: boolean
}

export async function createCategory(input: CategoryInput): Promise<DbCategory> {
  const { data, error } = await db().from('categories').insert(input).select().single()
  if (error) throw error
  await revalidateCatalog()
  return data as DbCategory
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<void> {
  const { error } = await db().from('categories').update(patch).eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from('categories').delete().eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

// ── Customers ───────────────────────────────────────────────────────────────

export interface AdminCustomer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  is_admin: boolean
}

/** Readable only by an admin — the "admin reads all profiles" policy allows it. */
export async function adminFetchCustomers(): Promise<AdminCustomer[]> {
  const { data, error } = await db()
    .from('profiles')
    .select('id, full_name, email, phone, created_at, is_admin')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminCustomer[]
}

// ── Coupons ─────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string
  code: string
  type: 'PERCENT' | 'FLAT' | 'FREESHIP'
  value: number
  min_order: number
  usage_limit: number | null
  used_count: number
  is_active: boolean
}

export async function adminFetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await db().from('coupons').select('*').order('code')
  if (error) throw error
  return (data ?? []) as Coupon[]
}

export async function createCoupon(c: Omit<Coupon, 'id' | 'used_count'>): Promise<void> {
  const { error } = await db().from('coupons').insert(c)
  if (error) throw error
}

export async function updateCoupon(id: string, patch: Partial<Coupon>): Promise<void> {
  const { error } = await db().from('coupons').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await db().from('coupons').delete().eq('id', id)
  if (error) throw error
}

// ── Store settings ──────────────────────────────────────────────────────────

export interface StoreSettings {
  free_shipping_over: number
  shipping_fee: number
  cod_enabled: boolean
  cod_fee: number
  cod_max_order: number
  partial_cod_enabled: boolean
  partial_cod_advance: number
  /** Percent (0-100) when prepaid_discount_type is PERCENT, rupees when FLAT. */
  prepaid_discount_pct: number
  prepaid_discount_type: 'PERCENT' | 'FLAT'
  prepaid_discount_min_order: number
}

export async function fetchSettings(): Promise<StoreSettings | null> {
  const { data, error } = await db().from('store_settings').select('*').maybeSingle()
  if (error) throw error
  return (data as StoreSettings) ?? null
}

export async function updateSettings(patch: Partial<StoreSettings>): Promise<void> {
  const { error } = await db().from('store_settings').update(patch).eq('id', true)
  if (error) throw error
  await revalidateCatalog()
}

// ── Media ───────────────────────────────────────────────────────────────────

export interface MediaRow {
  id: string
  product_id: string
  type: string
  url: string
  alt: string | null
  position: number
}

export async function adminFetchMedia(): Promise<(MediaRow & { product?: { title: string } })[]> {
  const { data, error } = await db()
    .from('product_media')
    .select('*, products(title)')
    .order('position')
  if (error) throw error
  return (data ?? []) as (MediaRow & { product?: { title: string } })[]
}

// ── Collections ─────────────────────────────────────────────────────────────

export interface Collection {
  id: string
  slug: string
  name: string
  description: string | null
  image: string | null
  is_active: boolean
}

export async function adminFetchCollections(): Promise<(Collection & { count: number })[]> {
  const { data, error } = await db()
    .from('collections')
    .select('*, product_collections(product_id)')
    .order('position')
  if (error) throw error
  return (data ?? []).map((c) => {
    const { product_collections, ...rest } = c as Collection & {
      product_collections: { product_id: string }[]
    }
    return { ...rest, count: product_collections?.length ?? 0 }
  })
}

export async function createCollection(c: {
  slug: string
  name: string
  description?: string | null
}): Promise<void> {
  const { error } = await db().from('collections').insert(c)
  if (error) throw error
  await revalidateCatalog()
}

export async function updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
  const { error } = await db().from('collections').update(patch).eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await db().from('collections').delete().eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

// ── Homepage sections ───────────────────────────────────────────────────────

export const SECTION_TYPES = [
  'HERO_SLIDER',
  'USP_STRIP',
  'PRODUCT_RAIL',
  'CATEGORY_TILES',
  'VIDEO_HERO',
  'BRAND_STRIP',
  'SPLIT_BANNER',
  'NEWSLETTER',
] as const

export const SECTION_SOURCES = [
  'FEATURED',
  'COLLECTION',
  'CATEGORY',
  'SALE',
  'NEWEST',
  'MANUAL',
] as const

export interface HomepageSection {
  id: string
  type: (typeof SECTION_TYPES)[number]
  title: string
  subtitle: string | null
  source: (typeof SECTION_SOURCES)[number]
  source_slug: string | null
  item_limit: number
  position: number
  is_visible: boolean
  /**
   * Optional schedule. Either may be null.
   *
   * The columns have existed since 0011 and nothing ever set or read them, so a
   * shop wanting a Diwali rail had to remember to switch it on and off by hand.
   */
  starts_at: string | null
  ends_at: string | null
}

export async function adminFetchSections(): Promise<HomepageSection[]> {
  const { data, error } = await db()
    .from('homepage_sections')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as HomepageSection[]
}

export async function createSection(
  s: Omit<HomepageSection, 'id' | 'position'> & { position?: number },
): Promise<void> {
  const { error } = await db().from('homepage_sections').insert(s)
  if (error) throw error
  await revalidateCatalog()
}

export async function updateSection(
  id: string,
  patch: Partial<Omit<HomepageSection, 'id'>>,
): Promise<void> {
  const { error } = await db().from('homepage_sections').update(patch).eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

export async function deleteSection(id: string): Promise<void> {
  const { error } = await db().from('homepage_sections').delete().eq('id', id)
  if (error) throw error
  await revalidateCatalog()
}

/** Writes the new order after a move. Positions are 1-based to match the seed. */
export async function reorderSections(sections: HomepageSection[]): Promise<void> {
  await Promise.all(
    sections.map((s, i) =>
      db().from('homepage_sections').update({ position: i + 1 }).eq('id', s.id),
    ),
  )
  await revalidateCatalog()
}
