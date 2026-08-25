import type { Product } from './types'

/**
 * Product filtering and sorting.
 *
 * Pure functions with no React in them, so the listing pages share one
 * implementation and it can be reasoned about (and tested) on its own.
 *
 * Facets are DERIVED FROM THE PRODUCTS, never hardcoded. The previous sidebar
 * offered fourteen brands and a ₹799–3,500 range against a catalog holding five
 * brands priced ₹1,299–3,299, so most options returned nothing.
 */

export type SortKey = 'featured' | 'new' | 'low' | 'high' | 'discount' | 'name'

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'new', label: 'Newest first' },
  { key: 'low', label: 'Price: low to high' },
  { key: 'high', label: 'Price: high to low' },
  { key: 'discount', label: 'Biggest discount' },
  { key: 'name', label: 'Name: A to Z' },
]

export interface Filters {
  categories: string[]
  brands: string[]
  sizes: number[]
  /** null means "no bound set" — distinct from a bound that equals the extreme. */
  minPrice: number | null
  maxPrice: number | null
  minDiscount: number | null
  inStockOnly: boolean
  newOnly: boolean
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = {
  categories: [],
  brands: [],
  sizes: [],
  minPrice: null,
  maxPrice: null,
  minDiscount: null,
  inStockOnly: false,
  newOnly: false,
  sort: 'featured',
}

export interface Facets {
  categories: { value: string; label: string; count: number }[]
  brands: { value: string; count: number }[]
  sizes: { value: number; count: number }[]
  priceMin: number
  priceMax: number
  maxDiscount: number
  hasOutOfStock: boolean
  hasNew: boolean
}

const titleCase = (slug: string) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Builds the available filter options from whatever products are in scope. */
export function deriveFacets(products: Product[]): Facets {
  const cats = new Map<string, number>()
  const brands = new Map<string, number>()
  const sizes = new Map<number, number>()
  let priceMin = Infinity
  let priceMax = -Infinity
  let maxDiscount = 0
  let hasOutOfStock = false
  let hasNew = false

  for (const p of products) {
    for (const c of p.categories ?? []) cats.set(c, (cats.get(c) ?? 0) + 1)
    if (p.brand) brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1)
    for (const s of p.sizes ?? []) {
      if (isSizeAvailable(p, s)) sizes.set(s, (sizes.get(s) ?? 0) + 1)
    }
    if (p.price < priceMin) priceMin = p.price
    if (p.price > priceMax) priceMax = p.price
    if ((p.discount ?? 0) > maxDiscount) maxDiscount = p.discount ?? 0
    if (isOutOfStock(p)) hasOutOfStock = true
    if (p.isNew) hasNew = true
  }

  return {
    categories: [...cats.entries()]
      .map(([value, count]) => ({ value, label: titleCase(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    brands: [...brands.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    sizes: [...sizes.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value),
    // Round outward to whole hundreds so the slider lands on tidy numbers.
    priceMin: Number.isFinite(priceMin) ? Math.floor(priceMin / 100) * 100 : 0,
    priceMax: Number.isFinite(priceMax) ? Math.ceil(priceMax / 100) * 100 : 0,
    maxDiscount,
    hasOutOfStock,
    hasNew,
  }
}

/** `stock` is optional on Product, so absence must not read as out of stock. */
export function isOutOfStock(p: Product): boolean {
  if (p.badge === 'SOLD OUT') return true
  return typeof p.stock === 'number' && p.stock <= 0
}

/**
 * Whether `size` is actually purchasable on `p`, not just declared in
 * `p.sizes` — a product can be in stock overall with individual sizes sold
 * out. Falls back to the product-level check when `sizeStock` wasn't fetched
 * (only listings with a size filter embed it; see PRODUCT_SELECT_WITH_SIZE_STOCK
 * in lib/catalog.ts).
 */
export function isSizeAvailable(p: Product, size: number): boolean {
  if (!(p.sizes ?? []).includes(size)) return false
  if (isOutOfStock(p)) return false
  if (p.sizeStock) return (p.sizeStock[size] ?? 0) > 0
  return true
}

/** Discount thresholds, trimmed to what the catalog can actually satisfy. */
export function discountSteps(maxDiscount: number): number[] {
  return [10, 20, 30, 40, 50, 60].filter((d) => d <= maxDiscount)
}

export function applyFilters(products: Product[], f: Filters): Product[] {
  const out = products.filter((p) => {
    if (f.categories.length && !(p.categories ?? []).some((c) => f.categories.includes(c))) return false
    if (f.brands.length && !f.brands.includes(p.brand)) return false
    if (f.sizes.length && !f.sizes.some((s) => isSizeAvailable(p, s))) return false
    if (f.minPrice !== null && p.price < f.minPrice) return false
    if (f.maxPrice !== null && p.price > f.maxPrice) return false
    if (f.minDiscount !== null && (p.discount ?? 0) < f.minDiscount) return false
    if (f.inStockOnly && isOutOfStock(p)) return false
    if (f.newOnly && !p.isNew) return false
    return true
  })

  // Sort a copy — callers pass arrays they may still be rendering from.
  switch (f.sort) {
    case 'low':
      return out.sort((a, b) => a.price - b.price)
    case 'high':
      return out.sort((a, b) => b.price - a.price)
    case 'discount':
      return out.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    case 'new':
      return out.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false))
    case 'name':
      return out.sort((a, b) => `${a.brand} ${a.title}`.localeCompare(`${b.brand} ${b.title}`))
    default:
      return out
  }
}

export function activeCount(f: Filters): number {
  return (
    f.categories.length +
    f.brands.length +
    f.sizes.length +
    (f.minPrice !== null || f.maxPrice !== null ? 1 : 0) +
    (f.minDiscount !== null ? 1 : 0) +
    (f.inStockOnly ? 1 : 0) +
    (f.newOnly ? 1 : 0)
  )
}

// ── URL serialisation ───────────────────────────────────────────────────────
// Filters live in the query string so a filtered view can be shared, bookmarked
// and reached with the back button.

export function filtersToParams(f: Filters): URLSearchParams {
  const q = new URLSearchParams()
  if (f.categories.length) q.set('cat', f.categories.join(','))
  if (f.brands.length) q.set('brand', f.brands.join(','))
  if (f.sizes.length) q.set('size', f.sizes.join(','))
  if (f.minPrice !== null) q.set('min', String(f.minPrice))
  if (f.maxPrice !== null) q.set('max', String(f.maxPrice))
  if (f.minDiscount !== null) q.set('off', String(f.minDiscount))
  if (f.inStockOnly) q.set('stock', '1')
  if (f.newOnly) q.set('new', '1')
  if (f.sort !== 'featured') q.set('sort', f.sort)
  return q
}

export function filtersFromParams(q: URLSearchParams): Filters {
  const list = (k: string) => (q.get(k) ? q.get(k)!.split(',').filter(Boolean) : [])
  const num = (k: string) => {
    const v = q.get(k)
    if (v === null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const sort = q.get('sort') as SortKey | null
  return {
    categories: list('cat'),
    brands: list('brand'),
    sizes: list('size').map(Number).filter((n) => !Number.isNaN(n)),
    minPrice: num('min'),
    maxPrice: num('max'),
    minDiscount: num('off'),
    inStockOnly: q.get('stock') === '1',
    newOnly: q.get('new') === '1',
    sort: sort && SORTS.some((s) => s.key === sort) ? sort : 'featured',
  }
}
