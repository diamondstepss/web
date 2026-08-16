import { NextResponse, type NextRequest } from 'next/server'
import { priceOrder, CheckoutError, type RequestedLine, type PaymentMode, type FulfillmentType } from '@/lib/server/pricing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Previews a coupon against the real basket without creating an order, so the
 * cart can show the discount before the customer commits. Validation lives in
 * priceOrder, so this can never disagree with what checkout actually charges.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      lines?: RequestedLine[]
      mode?: PaymentMode
      couponCode?: string
      fulfillmentType?: FulfillmentType
    }
    const priced = await priceOrder(
      body.lines ?? [],
      body.mode ?? 'PREPAID',
      body.couponCode,
      body.fulfillmentType ?? 'DELIVERY',
    )
    return NextResponse.json({
      valid: Boolean(priced.couponCode),
      code: priced.couponCode,
      couponDiscount: priced.couponDiscount,
      total: priced.total,
      shippingFee: priced.shippingFee,
    })
  } catch (e) {
    const message = e instanceof CheckoutError ? e.message : 'Could not check that coupon.'
    return NextResponse.json({ valid: false, error: message }, { status: 200 })
  }
}
