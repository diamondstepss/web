import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { priceOrder, CheckoutError, type RequestedLine, type PaymentMode } from '@/lib/server/pricing'
import { createPaymentSession, isCashfreeConfigured } from '@/lib/server/cashfree'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * The only place an order can be created.
 *
 * The client sends slugs, sizes and quantities. Prices, discounts, fees and
 * totals are all resolved from Postgres here, so the amount charged can never
 * be influenced by the browser.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })

  let body: {
    lines?: RequestedLine[]
    mode?: PaymentMode
    couponCode?: string | null
    addressId?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const mode = body.mode ?? 'PREPAID'

  try {
    const priced = await priceOrder(body.lines ?? [], mode, body.couponCode)

    // Address must belong to the caller — RLS enforces it on this read.
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', body.addressId ?? '')
      .maybeSingle()

    if (!address) {
      return NextResponse.json({ error: 'Choose a delivery address.' }, { status: 400 })
    }

    const orderNumber = `DS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: order, error } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'CONFIRMED',
        payment_mode: mode,
        payment_status: 'PENDING',
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping_fee: priced.shippingFee,
        cod_fee: priced.codFee,
        total: priced.total,
        // Only the payment webhook may record money as received.
        amount_paid_online: 0,
        amount_due_on_delivery: priced.amountDueOnDelivery,
        shipping_address: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
      })
      .select('id, order_number, total')
      .single()

    if (error) {
      console.error('[checkout] order insert failed', error)
      return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 })
    }

    const { error: itemsError } = await admin.from('order_items').insert(
      priced.lines.map((l) => ({ ...l, order_id: order.id })),
    )
    if (itemsError) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 })
    }

    // Reserve stock now so two people can't buy the last pair. A sized line
    // decrements that size's own row; a sizeless one (an accessory) still
    // decrements the product total directly — PostgREST picks the matching
    // decrement_stock overload from which of these args are present.
    for (const l of priced.lines) {
      if (l.size) {
        await admin.rpc('decrement_stock', { p_slug: l.product_id, p_size: l.size, p_qty: l.qty })
      } else {
        await admin.rpc('decrement_stock', { p_slug: l.product_id, p_qty: l.qty })
      }
    }

    if (priced.couponCode) {
      await admin.rpc('increment_coupon_use', { p_code: priced.couponCode })
    }

    // Money owed online → hand back a Cashfree session for the browser SDK.
    let paymentSessionId: string | null = null
    if (priced.amountPaidOnline > 0 && isCashfreeConfigured) {
      try {
        const session = await createPaymentSession({
          orderNumber,
          amount: priced.amountPaidOnline,
          customer: {
            id: user.id,
            name: address.name,
            email: user.email ?? '',
            phone: address.phone,
          },
          returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin}/checkout/success?order=${orderNumber}`,
        })
        paymentSessionId = session?.paymentSessionId ?? null
      } catch (e) {
        // The order exists and is unpaid; the customer can retry payment.
        console.error('[checkout] payment session failed', e)
      }
    }

    return NextResponse.json({
      orderNumber,
      total: priced.total,
      amountPaidOnline: priced.amountPaidOnline,
      amountDueOnDelivery: priced.amountDueOnDelivery,
      paymentSessionId,
    })
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('[checkout] unexpected', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
