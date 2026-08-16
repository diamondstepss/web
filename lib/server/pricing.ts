import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Authoritative pricing. Server-only, on purpose.
 *
 * The browser sends product slugs, sizes and quantities — never prices. Every
 * amount below is read from Postgres, so a crafted request cannot buy a
 * ₹3,000 sneaker for ₹1. This is the rule PLAN.md §8 calls out.
 */

export interface RequestedLine {
  productId: string // slug
  size: string | null
  qty: number
}

export interface PricedLine {
  product_id: string
  brand: string
  title: string
  size: string | null
  qty: number
  price: number
  image: string | null
}

export type PaymentMode = 'PREPAID' | 'COD' | 'PARTIAL_COD'

export interface PricedOrder {
  lines: PricedLine[]
  subtotal: number
  couponCode: string | null
  couponDiscount: number
  prepaidDiscount: number
  discount: number
  shippingFee: number
  codFee: number
  total: number
  amountPaidOnline: number
  amountDueOnDelivery: number
}

/** Service-role client: pricing must not depend on the caller's RLS view. */
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

interface Settings {
  free_shipping_over: number
  shipping_fee: number
  cod_enabled: boolean
  cod_fee: number
  cod_max_order: number
  partial_cod_enabled: boolean
  partial_cod_advance: number
  // Percent (0-100) when prepaid_discount_type is PERCENT, rupees when FLAT.
  prepaid_discount_pct: number
  prepaid_discount_type: 'PERCENT' | 'FLAT'
  prepaid_discount_min_order: number
}

const FALLBACK: Settings = {
  free_shipping_over: 999,
  shipping_fee: 99,
  cod_enabled: true,
  cod_fee: 49,
  cod_max_order: 10000,
  partial_cod_enabled: true,
  partial_cod_advance: 300,
  prepaid_discount_pct: 30,
  prepaid_discount_type: 'FLAT',
  prepaid_discount_min_order: 1499,
}

export async function getSettings(): Promise<Settings> {
  const { data } = await admin().from('store_settings').select('*').maybeSingle()
  if (!data) return FALLBACK
  // Coalesced in case this reads before the migrations adding these columns
  // have run: 0 min-order means "no minimum," same as the flat discount's
  // always applied historically; PERCENT matches what prepaid_discount_pct
  // always meant before the type column existed. Either way this must not
  // silently disable the discount outright until the migration lands.
  return {
    ...(data as Settings),
    prepaid_discount_min_order: Number(data.prepaid_discount_min_order ?? 0),
    prepaid_discount_type: (data.prepaid_discount_type as 'PERCENT' | 'FLAT') ?? 'PERCENT',
  }
}

export class CheckoutError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
  }
}

/**
 * Prices a basket. Throws CheckoutError with a customer-safe message when
 * something is wrong — out of stock, inactive product, unusable coupon.
 */
export async function priceOrder(
  requested: RequestedLine[],
  mode: PaymentMode,
  couponCode?: string | null,
): Promise<PricedOrder> {
  if (!requested.length) throw new CheckoutError('Your cart is empty.')

  const db = admin()
  const slugs = [...new Set(requested.map((l) => l.productId))]

  const { data: products, error } = await db
    .from('products')
    .select('id, slug, brand, title, price, image, stock, is_active')
    .in('slug', slugs)

  if (error) throw new CheckoutError('Could not price your cart.', 500)

  const bySlug = new Map((products ?? []).map((p) => [p.slug as string, p]))

  // Per-size stock, for whichever of these products actually track it —
  // accessories have no rows here and fall back to `products.stock` below.
  const productIds = (products ?? []).map((p) => p.id as string)
  const { data: sizeStock } = productIds.length
    ? await db.from('product_size_stock').select('product_id, size, stock').in('product_id', productIds)
    : { data: [] }
  const stockBySize = new Map((sizeStock ?? []).map((r) => [`${r.product_id}:${r.size}`, r.stock as number]))

  const lines: PricedLine[] = requested.map((l) => {
    const p = bySlug.get(l.productId)
    if (!p) throw new CheckoutError(`A product in your cart is no longer available.`)
    if (!p.is_active) throw new CheckoutError(`"${p.title}" is no longer available.`)

    const qty = Math.max(1, Math.min(Math.floor(l.qty) || 1, 10))

    // A sized line checks that size's own count; a sizeless one (an
    // accessory, or a legacy line with no size) checks the product total.
    const available = l.size !== null ? stockBySize.get(`${p.id}:${l.size}`) ?? 0 : (p.stock as number)
    const label = l.size ? `"${p.title}" in UK ${l.size}` : `"${p.title}"`
    if (available < qty) {
      throw new CheckoutError(available === 0 ? `${label} just sold out.` : `Only ${available} left of ${label}.`)
    }

    return {
      product_id: p.slug as string,
      brand: p.brand as string,
      title: p.title as string,
      size: l.size,
      qty,
      price: Number(p.price), // ← from the database, never from the client
      image: (p.image as string) ?? null,
    }
  })

  const s = await getSettings()
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)

  if (mode === 'COD' && !s.cod_enabled) throw new CheckoutError('Cash on Delivery is unavailable.')
  if (mode === 'PARTIAL_COD' && !s.partial_cod_enabled)
    throw new CheckoutError('Partial COD is unavailable.')
  if (mode === 'COD' && subtotal > s.cod_max_order)
    throw new CheckoutError(`COD is not available above ₹${s.cod_max_order}. Please pay online.`)

  // ── Coupon ────────────────────────────────────────────────────────────────
  let couponDiscount = 0
  let freeShipFromCoupon = false
  let appliedCode: string | null = null

  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase()
    const { data: c } = await db.from('coupons').select('*').eq('code', code).maybeSingle()

    if (!c) throw new CheckoutError('That coupon code is not valid.')
    if (!c.is_active) throw new CheckoutError('That coupon is no longer active.')
    if (c.usage_limit !== null && c.used_count >= c.usage_limit)
      throw new CheckoutError('That coupon has been fully redeemed.')
    if (c.starts_at && new Date(c.starts_at) > new Date())
      throw new CheckoutError('That coupon is not active yet.')
    if (c.ends_at && new Date(c.ends_at) < new Date())
      throw new CheckoutError('That coupon has expired.')
    if (subtotal < Number(c.min_order))
      throw new CheckoutError(`Add ₹${Number(c.min_order) - subtotal} more to use ${code}.`)

    appliedCode = code
    if (c.type === 'PERCENT') couponDiscount = Math.round(subtotal * (Number(c.value) / 100))
    else if (c.type === 'FLAT') couponDiscount = Math.min(Number(c.value), subtotal)
    else freeShipFromCoupon = true
  }

  // Prepaid discount applies after the coupon, on what's actually being paid.
  // Gated on the pre-coupon subtotal — a coupon shouldn't be able to knock an
  // order back under the threshold and still keep the prepaid discount too.
  const afterCoupon = subtotal - couponDiscount
  const prepaidDiscount =
    mode === 'PREPAID' && subtotal >= s.prepaid_discount_min_order
      ? s.prepaid_discount_type === 'FLAT'
        ? Math.min(s.prepaid_discount_pct, afterCoupon)
        : Math.round(afterCoupon * (s.prepaid_discount_pct / 100))
      : 0

  const shippingFee =
    freeShipFromCoupon || subtotal >= s.free_shipping_over ? 0 : Number(s.shipping_fee)
  const codFee = mode === 'COD' ? Number(s.cod_fee) : 0

  const discount = couponDiscount + prepaidDiscount
  const total = Math.max(subtotal - discount + shippingFee + codFee, 0)

  let amountPaidOnline = 0
  if (mode === 'PREPAID') amountPaidOnline = total
  else if (mode === 'PARTIAL_COD') amountPaidOnline = Math.min(Number(s.partial_cod_advance), total)

  return {
    lines,
    subtotal,
    couponCode: appliedCode,
    couponDiscount,
    prepaidDiscount,
    discount,
    shippingFee,
    codFee,
    total,
    amountPaidOnline,
    amountDueOnDelivery: total - amountPaidOnline,
  }
}
