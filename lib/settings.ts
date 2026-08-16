import { SITE } from '@/data/site'

/**
 * Store settings, as the storefront should display them.
 *
 * The admin edits these in `store_settings`, and lib/server/pricing.ts charges
 * from that table — but the storefront was displaying hardcoded constants from
 * data/site.ts. Both happened to say ₹999, so nothing looked wrong; raising the
 * threshold in the admin would have charged shipping on an order the cart had
 * just promised was free.
 *
 * This is the read path for anything shown to a customer. It is never the
 * authority for what they are charged — priceOrder() re-reads the table
 * server-side, so a stale cache here can only ever affect a label.
 */

export interface StoreSettings {
  freeShippingOver: number
  shippingFee: number
  codEnabled: boolean
  codFee: number
  codMaxOrder: number
  partialCodEnabled: boolean
  partialCodAdvance: number
  /** Percent (0-100) when prepaidDiscountType is PERCENT, rupees when FLAT. */
  prepaidDiscountPct: number
  prepaidDiscountType: 'PERCENT' | 'FLAT'
  prepaidDiscountMinOrder: number
}

/** Used when the table is unreachable, so a page never renders a blank price. */
export const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingOver: SITE.freeShippingOver,
  shippingFee: 99,
  codEnabled: true,
  codFee: SITE.codFee,
  codMaxOrder: 10000,
  partialCodEnabled: true,
  partialCodAdvance: SITE.partialCodAdvance,
  prepaidDiscountPct: SITE.prepaidDiscountPct,
  prepaidDiscountType: SITE.prepaidDiscountType,
  prepaidDiscountMinOrder: SITE.prepaidDiscountMinOrder,
}

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

interface Row {
  free_shipping_over: number
  shipping_fee: number
  cod_enabled: boolean
  cod_fee: number
  cod_max_order: number
  partial_cod_enabled: boolean
  partial_cod_advance: number
  prepaid_discount_pct: number
  prepaid_discount_type: string
  prepaid_discount_min_order: number
}

/**
 * Plain fetch so Next can cache it alongside the catalog. Tagged `settings`, and
 * the admin's save already calls /api/revalidate, so a change shows up promptly
 * rather than waiting out the window.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !KEY) return DEFAULT_SETTINGS
  try {
    const res = await fetch(`${REST}/store_settings?select=*&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      next: { revalidate: 60, tags: ['settings', 'catalog'] },
    })
    if (!res.ok) {
      console.error('[settings]', res.status, await res.text())
      return DEFAULT_SETTINGS
    }
    const rows = (await res.json()) as Row[]
    const r = rows[0]
    if (!r) return DEFAULT_SETTINGS
    return {
      freeShippingOver: Number(r.free_shipping_over),
      shippingFee: Number(r.shipping_fee),
      codEnabled: Boolean(r.cod_enabled),
      codFee: Number(r.cod_fee),
      codMaxOrder: Number(r.cod_max_order),
      partialCodEnabled: Boolean(r.partial_cod_enabled),
      partialCodAdvance: Number(r.partial_cod_advance),
      prepaidDiscountPct: Number(r.prepaid_discount_pct),
      // Coalesced in case this reads before the migrations adding these
      // columns have run — see the matching comment in lib/server/pricing.ts.
      prepaidDiscountType: r.prepaid_discount_type === 'FLAT' ? 'FLAT' : 'PERCENT',
      prepaidDiscountMinOrder: Number(r.prepaid_discount_min_order ?? 0),
    }
  } catch (e) {
    console.error('[settings] fetch failed', e)
    return DEFAULT_SETTINGS
  }
}

/** Shipping on a given subtotal, using the same rule priceOrder() applies. */
export function shippingFor(subtotal: number, s: StoreSettings): number {
  if (subtotal <= 0) return 0
  return subtotal >= s.freeShippingOver ? 0 : s.shippingFee
}

/**
 * Prepaid discount for a given basis, using the same rule priceOrder()
 * applies server-side. `eligible` is separate from the amount because
 * callers need to know "does this basis clear the minimum" for its own
 * sake — e.g. to decide which copy to show, not just what number to show.
 */
export function prepaidDiscountFor(basis: number, s: StoreSettings): number {
  if (s.prepaidDiscountType === 'FLAT') return Math.min(s.prepaidDiscountPct, basis)
  return Math.round(basis * (s.prepaidDiscountPct / 100))
}
